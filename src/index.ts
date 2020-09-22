import {getInput, setFailed, info} from '@actions/core';
import {context, GitHub} from '@actions/github';
import {EventPayloads} from '@octokit/webhooks';
import {EligiblePullRequestsRetriever} from './EligiblePullRequests/eligiblePullRequestsRetriever';
import {Rebaser} from './rebaser';
import {TestableEligiblePullRequestsRetriever} from './EligiblePullRequests/testableEligiblePullRequestsRetriever';
import {GithubPullRequestInfoProvider} from './Github/githubPullRequestInfoProvider';
import {GithubGetPullRequestService} from './Github/Api/getPullRequestService';
import {GithubListPullRequestsService} from './Github/Api/listPullRequestsService';
import {GithubLabelPullRequestService} from './Github/githubLabelPullRequestService';
import {GithubOpenPullRequestsProvider} from './Github/githubOpenPullRequestsProvider';
import {Labeler} from './NonRebaseablePullRequests/labeler';

async function run(): Promise<void> {
    try {
        const github = new GitHub(getInput('github_token'));
        const openPullRequestsProvider = new GithubOpenPullRequestsProvider(
            new GithubListPullRequestsService(github),
            new GithubPullRequestInfoProvider(new GithubGetPullRequestService(github)),
        );
        const eligiblePullRequestsRetriever: EligiblePullRequestsRetriever = new TestableEligiblePullRequestsRetriever(
            openPullRequestsProvider,
        );
        const rebaser = new Rebaser(github);
        const labeler = new Labeler(openPullRequestsProvider, new GithubLabelPullRequestService(github));

        const payload = context.payload as EventPayloads.WebhookPayloadPush;

        info(`Received push on ${payload.ref}`);

        const ownerName = payload.repository.owner.login;
        const repoName = payload.repository.name;
        const base = payload.ref.split('/').slice(-1)[0];

        const pullRequests = await eligiblePullRequestsRetriever.findEligiblePullRequests(ownerName, repoName, base);

        await rebaser.rebasePullRequests(pullRequests);

        await labeler.createOptOutLabel(ownerName, repoName);
    } catch (e) {
        setFailed(e);
    }
}

void run();
