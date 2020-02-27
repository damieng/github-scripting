# PR-Process

Helps setup a Pull Review process by:

1. Create a CODEOWNERS file so all PR's are visible to that team
2. Creates a PR for the CODEOWNERS to be merged in
3. Assigns the people from the CODEOWNERS 
2. Creates four color-coded labels for PR sizing (tiny, small, medium, large)

## Setup

Provide a `.env` file in the root directory with the contents of `.env-sample`. They make the 'essential settings' and include your personal access token (repo level permission), team name for reviews, etc.

```javascript
GITHUB_API_TOKEN=82832askd9knsia42dbueiabdi2asndpasd1wwe
REVIEW_TEAM_NAME=dx-sdks-approver
YOUR_GITHUB_NAME=damieng
YOUR_GITHUB_EMAIL=damien.guard@auth0.com
```

Do note the team name does not prefix the organization.

If you wish to use multiple reviewers or individuals rather than teams you'll need to modify the script - specifically the lines that create the CODEOWNERS file (one individual/team per line) and the line that creates the PR to merge it in - array and/or switching from team_approvers to approvers.

## Running

Run the script with the org/repo name, e.g.

```bash
node app.js damieng/some-repo
```

Enjoy!
