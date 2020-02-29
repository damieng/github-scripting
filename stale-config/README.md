# Stale-Setup

Helps setup [Probot:Stale](https://github.com/probot/stale) by:

1. Creating a .github/stale.yml
2. Creating a labels for `stale`

## Setup

Provide a `.env` file in the root directory with the contents of `.env-sample`. They make the 'essential settings' and include your personal access token (repo level permission), team name for reviews, etc. 

```javascript
GITHUB_API_TOKEN=82832askd9knsia42dbueiabdi2asndpasd1wwe
REVIEW_TEAM_NAME=dx-sdks-approver
YOUR_GITHUB_NAME=damieng
YOUR_GITHUB_EMAIL=damien.guard@auth0.com
```

Then include the `stale.yml` fuke that will be checked in to the repo.

## Running

Run the script with the org/repo name, e.g.

```bash
node app.js damieng/some-repo
```

Enjoy!
