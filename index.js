const core = require("@actions/core");
const github = require("@actions/github");

(async () => {
  try {
    const labelsToFailString = core.getInput("labels-to-fail");
    const myToken = core.getInput("repo-token");

    const labelsToFail = labelsToFailString.split(",");
    if (!Array.isArray(labelsToFail) && labelsToFail.length) {
      throw new Error(
        "Input labels-to-fail should be a comma separated string"
      );
    }

    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret

    const octokit = new github.GitHub(myToken);
    const { owner, repo } = github.context.repo;
    const data = await octokit.checks.listForRef({
      owner,
      repo,
      ref: github.event.pull_request.head.sha
    });
    console.log("status checks");
    console.log(JSON.stringify(data));

    let {
      pull_request: { labels: prLabels }
    } = github.context.payload;

    prLabels = prLabels.map(({ name }) => name);
    const failedLabelsFound = prLabels.filter(labelName =>
      labelsToFail.includes(labelName)
    );

    if (failedLabelsFound.length) {
      const labels = failedLabelsFound.join(", ");
      throw new Error(`Labels to Fail found: ${labels}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
