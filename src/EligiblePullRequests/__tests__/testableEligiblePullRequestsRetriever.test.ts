import {
    OpenPullRequestsProvider,
    TestableEligiblePullRequestsRetriever,
} from '../testableEligiblePullRequestsRetriever';
import {MergeableState, PullRequestInfo} from '../../pullrequestinfo';
import each from 'jest-each';
import {OPT_IN_LABEL} from '../../labels';

class TestOpenPullRequestsProvider implements OpenPullRequestsProvider {
    openPullRequestsValue: PullRequestInfo[] = [];

    async openPullRequests(ownerName: string, repoName: string, base: string): Promise<PullRequestInfo[]> {
        return this.openPullRequestsValue;
    }
}

const testOpenPullRequestsProvider = new TestOpenPullRequestsProvider();
const retriever = new TestableEligiblePullRequestsRetriever(testOpenPullRequestsProvider);

test('Without open pull requests there are no eligible pull requests', async () => {
    /* When */
    const results = await retriever.findEligiblePullRequests('owner', 'repo', 'master');

    /* Then */
    expect(results).toStrictEqual([]);
});

describe('A pull request is eligible', () => {
    it(`when it is rebaseable and it has the label '${OPT_IN_LABEL}'`, async () => {
        /* Given */
        testOpenPullRequestsProvider.openPullRequestsValue = [
            {
                ownerName: 'owner',
                repoName: 'repo',
                number: 3,
                draft: false,
                rebaseable: true,
                mergeableState: 'behind',
                labels: [OPT_IN_LABEL],
            },
        ];

        /* When */
        const results = await retriever.findEligiblePullRequests('owner', 'repo', 'master');

        /* Then */
        expect(results).toStrictEqual([
            {
                ownerName: 'owner',
                repoName: 'repo',
                number: 3,
                draft: false,
                rebaseable: true,
                mergeableState: 'behind',
                labels: [OPT_IN_LABEL],
            },
        ]);
    });
});

describe('A pull request is not eligible', () => {
    it("when it isn't rebaseable", async () => {
        /* Given */
        testOpenPullRequestsProvider.openPullRequestsValue = [
            {
                ownerName: 'owner',
                repoName: 'repo',
                number: 3,
                draft: false,
                rebaseable: false,
                mergeableState: 'behind',
                labels: [OPT_IN_LABEL],
            },
        ];

        /* When */
        const results = await retriever.findEligiblePullRequests('owner', 'repo', 'master');

        /* Then */
        expect(results).toStrictEqual([]);
    });

    it(`when it doesn't have the '${OPT_IN_LABEL}' label`, async () => {
        /* Given */
        testOpenPullRequestsProvider.openPullRequestsValue = [
            {
                ownerName: 'owner',
                repoName: 'repo',
                number: 3,
                draft: false,
                rebaseable: true,
                mergeableState: 'behind',
                labels: [],
            },
        ];

        /* When */
        const results = await retriever.findEligiblePullRequests('owner', 'repo', 'master');

        /* Then */
        expect(results).toStrictEqual([]);
    });
});
