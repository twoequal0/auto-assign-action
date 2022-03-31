import {
  chooseUsers,
  chooseUsersFromGroups,
  includesSkipKeywords,
  fetchConfigurationFile,
} from '../src/utils'
import * as github from '@actions/github'

jest.mock('@actions/github')

describe('chooseUsers', () => {
  test('returns the reviewer list without the PR creator', () => {
    const prCreator = 'pr-creator'
    const reviewers = ['reviewer11', 'reviewer21', 'reviewer31', 'pr-creator']
    const numberOfReviewers = 0

    const list = chooseUsers(reviewers, numberOfReviewers, prCreator)

    expect(list).toEqual(['reviewer11', 'reviewer21', 'reviewer31'])
  })
})

describe('chooseUsersFromGroups', () => {
  test('should return one reviewer from each group, excluding the owner', () => {
    // GIVEN
    const owner = 'owner'
    const reviewers = {
      groupA: ['owner', 'reviewer1', 'reviewer2'],
      groupB: ['reviewer3'],
    }
    const numberOfReviewers = 0

    // WHEN
    const list = chooseUsersFromGroups(
      owner,
      reviewers,
      numberOfReviewers,
      false
    )

    // THEN
    expect(list).toEqual(['reviewer1', 'reviewer2'])
  })
})

describe('fetchConfigurationFile', () => {
  test('fetchs the configuration file', async () => {
    const client = new github.GitHub('token')

    client.repos = {
      getContents: jest.fn().mockImplementation(async () => ({
        data: {
          content:
            'IyBTZXQgdG8gdHJ1ZSB0byBhZGQgcmV2aWV3ZXJzIHRvIHB1bGwgcmVxdWVzdHMNCmFkZFJldmlld2VyczogdHJ1ZQ0KDQojIFNldCB0byB0cnVlIHRvIGFkZCBhc3NpZ25lZXMgdG8gcHVsbCByZXF1ZXN0cw0KYWRkQXNzaWduZWVzOiBmYWxzZQ0KDQojIEEgbGlzdCBvZiByZXZpZXdlcnMgdG8gYmUgYWRkZWQgdG8gcHVsbCByZXF1ZXN0cyAoR2l0SHViIHVzZXIgbmFtZSkNCnJldmlld2VyczoNCiAgLSByZXZpZXdlckENCiAgLSByZXZpZXdlckINCiAgLSByZXZpZXdlckM=',
        },
      })),
    } as any

    const config = await fetchConfigurationFile(client, {
      owner: 'kentaro-m',
      repo: 'auto-assign-action-test',
      path: '.github/auto_assign',
      ref: 'sha',
    })

    expect(config).toEqual({
      addAssignees: false,
      addReviewers: true,
      reviewers: ['reviewerA', 'reviewerB', 'reviewerC'],
    })
  })

  test('responds with an error if failure to fetch the configuration file', async () => {
    const client = new github.GitHub('token')

    client.repos = {
      getContents: jest.fn().mockImplementation(async () => ({
        data: {
          content: '',
        },
      })),
    } as any

    expect(
      fetchConfigurationFile(client, {
        owner: 'kentaro-m',
        repo: 'auto-assign-action-test',
        path: '.github/auto_assign',
        ref: 'sha',
      })
    ).rejects.toThrow(/the configuration file is not found/)
  })
})
