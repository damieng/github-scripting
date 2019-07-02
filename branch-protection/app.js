const Octokit = require('@octokit/rest');
const cp = require('child_process');

// Essential settings - change these as we can't have defaults
const personalAccessToken = 'your personal access token';
const reviewTeams = [ 'your-team-name' ];

// Optional tweaks - these are sensible defaults
const gitHubUrl = 'github.com'; // Change this if GitHub Enterprise
const dismissTeams = reviewTeams;

// Regular source, should not need to change
var startCommand = process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open';
var openUrl = (url) => cp.exec(`${startCommand} ${url}`);
var octokit = new Octokit(
    {
        auth: personalAccessToken,
        userAgent: 'Branch Protection script',
        baseUrl: `https://api.${gitHubUrl}`,
        log: {
            debug: () => { },
            info: () => { },
            warn: console.warn,
            error: console.error
        },
        previews: [ 'luke-cage-preview', 'antiope-preview' ]
    }
);

async function run(owner, repo) {
    console.log('Setting up branch protection ...');

    let existingBranchProtection;
    let checks = [];

    try {
      existingBranchProtection = (await octokit.repos.getBranchProtection({ owner, repo, branch: 'master' })).data;
      checks = existingBranchProtection.required_status_checks.contexts;
      console.log(`Existing branch protection found, checks are: [ ${checks.map(c => "'" + c + "'").join(', ')} ]`);
    }
    catch {
        console.log(`No existing branch protection found. Must setup checks manually (no API)!`);
    }

    const branchProtectionParams = {
        "owner": owner,
        "repo": repo,
        "branch": "master",
        "enforce_admins": false,
        "required_status_checks": {
            "strict": true,
            "contexts": checks,
        },
        "required_pull_request_reviews": {
            "required_approving_review_count": 1,
            "require_code_owner_reviews": false,
            "dismiss_stale_reviews": true,
            "dismissal_restrictions": {
                "users": [],
                "teams": dismissTeams
            }
        },
        "restrictions": {
            "users": [],
            "teams": reviewTeams
        }
    };

    (await octokit.repos.updateBranchProtection(branchProtectionParams)).data;
    openUrl(`https://${gitHubUrl}/${owner}/${repo}/settings/branches`)
}

if (personalAccessToken === 'your personal access token') {
    console.log('No personal access token specified, opening browser to create one... copy it into the source!');
    openUrl(`https://${gitHubUrl}/settings/tokens`);
} else {
    run(...process.argv[2].split('/'));
}
