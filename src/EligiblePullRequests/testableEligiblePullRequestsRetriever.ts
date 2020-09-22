import {PullRequestInfo} from '../pullrequestinfo';
import {EligiblePullRequestsRetriever} from './eligiblePullRequestsRetriever';
import {info} from '@actions/core';
import {OPT_OUT_LABEL} from '../labels';

// Secondary port for [[TestableEligiblePullRequestsRetriever]]
export interface OpenPullRequestsProvider {
    openPullRequests(ownerName: string, repoName: string, base: string): Promise<PullRequestInfo[]>;
}

export class TestableEligiblePullRequestsRetriever implements EligiblePullRequestsRetriever {
    private openPullRequestsProvider: OpenPullRequestsProvider;

    constructor(openPullRequestsProvider: OpenPullRequestsProvider) {
        this.openPullRequestsProvider = openPullRequestsProvider;
    }

    async findEligiblePullRequests(ownerName: string, repoName: string, base: string): Promise<PullRequestInfo[]> {
        const pullRequests = await this.openPullRequestsProvider.openPullRequests(ownerName, repoName, base);

        info(`Found ${pullRequests.length} open pull requests against ${base}`);

        const results = pullRequests.filter((value) => {
            return TestableEligiblePullRequestsRetriever.isEligible(value);
        });

        info(`${results.length} pull requests are eligible.`);

        return results;
    }

    private static isEligible(pullRequestInfo: PullRequestInfo): boolean {
        if (pullRequestInfo.labels.includes(OPT_OUT_LABEL)) {
            info(`PR #${pullRequestInfo.number} has the '${OPT_OUT_LABEL}' label.`);
            return false;
        }

        if (!pullRequestInfo.rebaseable) {
            info(`PR #${pullRequestInfo.number} is not rebaseable.`);
            return false;
        }

        return true;
    }
}
