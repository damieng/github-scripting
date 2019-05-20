# PR-Process

Helps setup a Pull Review process by:

1. Create a CODEOWNERS file so all PR's are visible to that team
2. Creates a PR for the CODEOWNERS to be merged in
3. Assigns the people from the CODEOWNERS 
2. Creates four color-coded labels for PR sizing (tiny, small, medium, large)

## Setup

Modify the scripts 'essential settings' section with your personal access token, team name for reviews etc.

```javascript
// Essential settings - change these as we can't have defaults
const personalAccessToken = 'your personal access token';
const reviewTeam = '@your-org/@your-team';
const committer = {
    name: 'Your Name',
    email: 'Your Email'
};
```

If you wish to use multiple reviewers or individuals rather than teams you'll need to modify the script - specifically the lines that create the codeowners file (one individual/team per line) and the line that creates the PR to merge it in - array and/or switching from team_approvers to approvers.

## Running

Run the script with the org/repo name, e.g.

```bash
node app.js @damieng/some-repo
```

Enjoy!