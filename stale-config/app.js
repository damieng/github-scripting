const Octokit = require('@octokit/rest');
const cp = require('child_process');
const fs = require('fs');

require('dotenv').config({ path: '../.env' });

// Essential settings - change these as we can't have defaults
const personalAccessToken = process.env.GITHUB_API_TOKEN;
const committer = {
    name: process.env.YOUR_GITHUB_NAME,
    email: process.env.YOUR_GITHUB_EMAIL
};

// Optional tweaks - these are sensible defaults
const gitHubUrl = 'github.com'; // Change this if GitHub Enterprise
const message = 'Setup the .github/stale.yml for Probot:Stale';
const labelsToCreate = [
    { name: 'closed:stale', color: 'cfd3d7', description: 'Issue or PR has not seen activity recently' },
];

// Regular source, should not need to change
const stalePath = '.github/stale.yml';
const startCommand = process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open';
const openUrl = (url) => cp.exec(`${startCommand} ${url}`);
const octokit = new Octokit(
    {
        auth: personalAccessToken,
        userAgent: 'Stale Setup Script',
        baseUrl: `https://api.${gitHubUrl}`,
        log: {
            debug: () => { },
            info: () => { },
            warn: console.warn,
            error: console.error
        },
        previews: ['symmetra-preview']
    }
);

async function run(owner, repo) {
    await createLabels(owner, repo);
    await updateStaleDirect(owner, repo);
}

async function createLabels(owner, repo) {
    console.log('Creating labels ...');
    try {
        await Promise.all(labelsToCreate
            .map(l => ({ owner, repo, name: l.name, color: l.color, description: l.description }))
            .map(l => octokit.issues.createLabel(l)));
    }
    catch (e)
    {
        console.log('One or more labels probably existed (Go check)');
    }
}

async function updateStaleDirect(owner, repo) {
    fs.readFile("stale.yml", async function(err, content) {
        if (err) throw err;

        let repository = {};
        try {
            repository = (await octokit.repos.get({ owner, repo })).data;
        } catch( error ) {
            console.log( 'Error getting repo: ' + formatErrorMessage(error) );
            return;
        }

        const defaultBranch = repository.default_branch;
        console.log(`Updating ${stalePath} on ${defaultBranch} ...`);
        
        let getContentsOpts = {
            owner, 
            repo, 
            path: stalePath, 
            branch: defaultBranch
        };
        
        let existing = {};
        try {
            existing = (await octokit.repos.getContents(getContentsOpts)).data;
            console.log( stalePath + ' exists. Updating ...' );
        } catch( err ) {
            if (404 !== err.status) {
                console.log( 'Error getting repo contents: ' + formatErrorMessage(error) );
                console.log(getContentsOpts);
            }

            console.log( stalePath + ' does not exist. Creating ...' );
        }

        let updateFileOpts = { 
            owner, 
            repo, 
            path: stalePath, 
            message, 
            content: Buffer.from(content).toString('base64'), 
            committer, 
            author: committer, 
            branch: defaultBranch,
            sha: existing.sha
        };

        try {
            const updateFile = await octokit.repos.createOrUpdateFile(updateFileOpts)
        } catch( error ) {
            console.log( 'Error creating or updating file: ' + formatErrorMessage(error) );
            console.log(updateFileOpts);
            return;
        }

        console.log( stalePath + ' created or updated' );
    })
}

function formatErrorMessage(error) {
    return ( err.name || 'Unknown error name' ) + ' - ' + ( err.status || 'Unknown error code' );
}

if (personalAccessToken === 'your personal access token') {
    console.log('No personal access token specified, opening browser to create one... copy it into the source!');
    openUrl(`https://${gitHubUrl}/settings/tokens`);
} else {
    run(...process.argv[2].split('/'));
}
