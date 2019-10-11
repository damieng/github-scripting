const Octokit = require('@octokit/rest');
const cp = require('child_process');
const fs = require('fs');

// Essential settings - change these as we can't have defaults
const personalAccessToken = '';

// Optional tweaks - these are sensible defaults
const gitHubUrl = 'github.com'; // Change this if GitHub Enterprise
const message = 'Setup the .github/stale.yml for Probot:Stale';
const labelsToCreate = [
    { name: 'stale', color: '666666', description: 'Stale' },
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
    fs.readFile("stale.yml", function(err, content) {
        if (err) throw err;

        const repository = (await octokit.repos.get({ owner, repo })).data;
        const defaultBranch = repository.default_branch;
        console.log(`Updating ${stalePath} on ${defaultBranch} ...`);
        const existing = (await octokit.repos.getContents({owner, repo, path: stalePath, branch: defaultBranch})).data;
        const updateFile = await octokit.repos.createOrUpdateFile(
            { owner, repo, path: stalePath, message, content, committer, author: committer, branch: defaultBranch, sha: existing.sha })
    })
}

if (personalAccessToken === 'your personal access token') {
    console.log('No personal access token specified, opening browser to create one... copy it into the source!');
    openUrl(`https://${gitHubUrl}/settings/tokens`);
} else {
    run(...process.argv[2].split('/'));
}
