# Branch-Protections

Helps setup a master branch protection policy by setting:

- *Require pull request reviews before merging*: `true`
    - *Required approving reviews*: `1`
    - *Dismiss stale pull request approvals when new commits are pushed*: `true`
    - *Restrict who can dismiss pull request reviews*: your team list
- *Require status checks to pass before merging*: `true`
    - *Require branches to be up to date*: `true`
    - *Status checks required list*: preserved if exists
- *Include administrators*: `false`
- *Restrict who can push to matching branches*: your team list 

(You can easily change these in the code)
## Setup

Modify the scripts 'essential settings' section with your personal access token, team name for reviews etc.

```javascript
// Essential settings - change these as we can't have defaults
const personalAccessToken = 'your personal access token';
const reviewTeams = [ 'your-team' ];
const dismissTeams = reviewTeams;
```

If you wish to change the settings simply change the object around line 45 to set the settings you want or do not want.


If you wish to use multiple reviewers or individuals rather than teams you'll need to modify the script - specifically the lines that create the codeowners file (one individual/team per line) and the line that creates the PR to merge it in - array and/or switching from team_approvers to approvers.

## Running

Run the script with the org/repo name, e.g.

```bash
node app.js @damieng/some-repo
```

Enjoy!