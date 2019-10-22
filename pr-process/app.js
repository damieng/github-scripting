const Octokit = require('@octokit/rest');
const cp = require('child_process');

let additionalLabels = [];
try {
    additionalLabels = require('./additional-labels');
} catch (error) {}

require('dotenv').config({ path: '../.env' })

// Essential settings - change these as we can't have defaults
const personalAccessToken = process.env.GITHUB_API_TOKEN;
const reviewTeam = process.env.REVIEW_TEAM_NAME;
const committer = {
    name: process.env.YOUR_GITHUB_NAME,
    email: process.env.YOUR_GITHUB_EMAIL
};

// Optional tweaks - these are sensible defaults
const prBranch = 'add-codeowners';
const gitHubUrl = 'github.com'; // Change this if GitHub Enterprise
const message = 'Setup the CODEOWNERS for pull request reviews';
const labelsToCreate = [
    // PR review tags
    { name: 'review:large', color: 'ff7043', description: 'Large review' },
    { name: 'review:medium', color: 'ffb74d', description: 'Medium review' },
    { name: 'review:small', color: 'ffe082', description: 'Small review' },
    { name: 'review:tiny', color: 'fff9c4', description: 'Tiny review' },

    // PR labels for changelog generation
    { name: 'CH: Added', color: '5319e7', description: 'PR is adding feature or functionality' },
    { name: 'CH: Breaking Change', color: '5319e7', description: 'PR contains breaking changes without a major version bump' },
    { name: 'CH: Deprecated', color: '5319e7', description: 'PR is deprecating something in the public API' },
    { name: 'CH: Fixed', color: '5319e7', description: 'PR is fixing a bug' },
    { name: 'CH: Changed', color: '5319e7', description: 'PR is changing something' },
    { name: 'CH: Removed', color: '5319e7', description: 'PR is removing something' },
    { name: 'CH: Security', color: '5319e7', description: 'PR is security improvement' }
].concat(additionalLabels);

// Regular source, should not need to change
const content = Buffer.from(`*\t${reviewTeam}\n`).toString('base64');
const codeOwnersPath = '.github/CODEOWNERS';
const startCommand = process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open';
const openUrl = (url) => cp.exec(`${startCommand} ${url}`);
const octokit = new Octokit(
    {
        auth: personalAccessToken,
        userAgent: 'PR Process Script',
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
    if (!personalAccessToken || !reviewTeam || !committer.name || !committer.email)
        throw Error('Must setup essential settings before running script.')

    await createLabels(owner, repo);
    // Use this to setup a new flow with a PR
    await createCodeOwnersPR(owner, repo);
    // OR this one to modify and existing directly
//    await updateCodeOwnersDirect(owner, repo);
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

async function updateCodeOwnersDirect(owner, repo) {
    const repository = (await octokit.repos.get({ owner, repo })).data;
    const defaultBranch = repository.default_branch;
    console.log(`Updating ${codeOwnersPath} on ${defaultBranch} ...`);
    const existing = (await octokit.repos.getContents({owner, repo, path: codeOwnersPath, branch: defaultBranch})).data;
    const updateFile = await octokit.repos.createOrUpdateFile(
        { owner, repo, path: codeOwnersPath, message, content, committer, author: committer, branch: defaultBranch, sha: existing.sha })
}

async function createCodeOwnersPR(owner, repo) {
    console.log(`Creating Pull Request to add ${codeOwnersPath} ...`);
    const repository = (await octokit.repos.get({ owner, repo })).data;
    const latest = (await octokit.repos.listCommits({ owner, repo, sha: repository.default_branch, per_page: 1 })).data[0];
    const newBranch = (await octokit.git.createRef({ owner, repo, ref: 'refs/heads/' + prBranch, sha: latest.sha})).data;
    try {
      const createFile = (await octokit.repos.createOrUpdateFile(
          { owner, repo, path: codeOwnersPath, message, content, committer, author: committer, branch: prBranch }
      ));
      const pr = (await octokit.pulls.create({ owner, repo, title: message, head: prBranch, base: repository.default_branch })).data;
      console.log(`Created PR #${pr.number}`);    
      const review = (await octokit.pulls.createReviewRequest({ owner, repo, pull_number: pr.number, team_reviewers: [ reviewTeam ]})).data;
      openUrl(`https://${gitHubUrl}/${owner}/${repo}/pull/${pr.number}`)
    }
    catch (e)
    {
      console.log(`Probably already had a ${codeOwnersPath} file (Go check)`);
    }
}

if (personalAccessToken === 'your personal access token') {
    console.log('No personal access token specified, opening browser to create one... copy it into the source!');
    openUrl(`https://${gitHubUrl}/settings/tokens`);
} else {
    run(...process.argv[2].split('/'));
}
