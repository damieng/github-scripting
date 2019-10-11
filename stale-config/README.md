# Stale-Setup

Helps setup [Probot:Stale](https://github.com/probot/stale) by:

1. Creating a .github/stale.yml
2. Creating a labels for `stale`

## Setup

Modify the scripts 'essential settings' section with your personal access token (repo level permission) and the included stale.yml that will be checked in to the repo.

```javascript
// Essential settings - change these as we can't have defaults
const personalAccessToken = '';
```

## Running

Run the script with the org/repo name, e.g.

```bash
node app.js damieng/some-repo
```

Enjoy!
