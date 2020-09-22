import {OpenPullRequestsProvider} from '../EligiblePullRequests/testableEligiblePullRequestsRetriever';
import {info} from '@actions/core';
import {PullRequestInfo} from '../pullrequestinfo';
import {OPT_OUT_LABEL} from '../labels';

// Secondary port for Labeler
export interface LabelPullRequestService {
    listLabels(ownerName: string, repoName: string): Promise<string[]>;

    createLabel(ownerName: string, repoName: string, label: string, color: string, description: string): Promise<void>;

    addLabel(ownerName: string, repoName: string, pullRequestNumber: number, label: string): Promise<void>;

    removeLabel(ownerName: string, repoName: string, pullRequestNumber: number, label: string): Promise<void>;
}

export class Labeler {
    constructor(
        private openPullRequestsProvider: OpenPullRequestsProvider,
        private labelPullRequestService: LabelPullRequestService,
    ) {}

    async createOptOutLabel(ownerName: string, repoName: string): Promise<void> {
        const labels = await this.labelPullRequestService.listLabels(ownerName, repoName);
        if (labels.includes(OPT_OUT_LABEL)) {
            return;
        }

        await this.labelPullRequestService.createLabel(
            ownerName,
            repoName,
            OPT_OUT_LABEL,
            'c0f276',
            'Apply this label to disable automatic rebasing for this PR',
        );
    }
}
