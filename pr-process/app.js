const Octokit = require('@octokit/rest');
const cp = require('child_process');

// Essential settings - change these as we can't have defaults
const personalAccessToken = 'your personal access token';
const reviewTeam = '@org/team';
const committer = {
    name: 'Your Name',
    email: 'Your Email'
};

// Optional tweaks - these are sensible defaults
const branch = 'add-codeowners';
const gitHubUrl = 'github.com'; // Change this if GitHub Enterprise
const message = 'Setup the CODEOWNERS for pull request reviews';
const labelsToCreate = [
    { name: 'large', color: 'ff7043', description: 'Large review' },
    { name: 'medium', color: 'ffb74d', description: 'Medium review' },
    { name: 'small', color: 'ffe082', description: 'Small review' },
    { name: 'tiny', color: 'fff9c4', description: 'Tiny review' },
];

// Regular source, should not need to change
var startCommand = process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open';
var openUrl = (url) => cp.exec(`${startCommand} ${url}`);
var octokit = new Octokit(
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
    const path = '.github/CODEOWNERS';
    const content = Buffer.from(`*\t${reviewTeam}\n`).toString('base64');    

    console.log('Creating labels ...');
    try {
        await Promise.all(labelsToCreate
            .map(l => ({ owner, repo, name: l.name, color: l.color, description: l.description }))
            .map(l => octokit.issues.createLabel(l)));
    }
    catch
    {
        console.log('One or more labels probably existed (Go check)');
    }

    console.log('Creating Pull Request to add .github/CODEOWNERS ...');
    const repository = (await octokit.repos.get({ owner, repo })).data;
    const latest = (await octokit.repos.listCommits({ owner, repo, sha: repository.default_branch, per_page: 1 })).data[0];
    const newBranch = (await octokit.git.createRef({ owner, repo, ref: 'refs/heads/' + branch, sha: latest.sha})).data;
    try {
      const newFile = (await octokit.repos.createFile(
          { owner, repo, path, message, content, committer, author: committer, branch }
      ));
      const pr = (await octokit.pulls.create({ owner, repo, title: message, head: branch, base: repository.default_branch })).data;
      console.log(`Created PR #${pr.number}`);    
      const review = (await octokit.pulls.createReviewRequest({ owner, repo, pull_number: pr.number, team_reviewers: [ reviewTeam ]})).data;
      openUrl(`https://${gitHubUrl}/${owner}/${repo}/pull/${pr.number}`)
    }
    catch
    {
      console.log('Probably already had a .github/CODEOWNERS file (Go check)');
    }
}

if (personalAccessToken === 'your personal access token') {
    console.log('No personal access token specified, opening browser to create one... copy it into the source!');
    openUrl(`https://${gitHubUrl}/settings/tokens`);
} else {
    run(...process.argv[2].split('/'));
}
