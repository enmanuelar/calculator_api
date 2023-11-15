import { expect } from "chai";
import {
  createRecordsHandler,
  deleteRecordsHandler,
  getRecordsHandler,
} from "../../app.mjs";
import * as td from "testdouble";
describe("Records Lambdas", async () => {
  let helpers;
  let lambda;

  beforeEach(async () => {
    helpers = await td.replaceEsm("../../helpers.mjs");
    lambda = await import("../../app.mjs");
    td.when(helpers.getUserIdFromAuth0(td.matchers.anything())).thenResolve(
      "mockedUserId",
    );
    td.when(
      helpers.getRecordsByUserId(
        td.matchers.anything(),
        td.matchers.anything(),
        td.matchers.anything(),
        td.matchers.anything(),
        td.matchers.anything(),
      ),
    ).thenResolve([
      {
        id: "123",
        userId: "mockedUserId",
        balance: 250,
        result: "20",
        date: "2023-11-07T00:00:00.000Z",
        cost: 10,
        operationType: "addition",
      },
    ]);
    td.when(
      helpers.getTotalRecordsCountByUserId(td.matchers.anything()),
    ).thenResolve([
      {
        total_count: 1,
      },
    ]);
    td.when(helpers.getOperationById(td.matchers.anything())).thenResolve([
      {
        id: "operation123",
        cost: 10,
        type: "addition",
      },
    ]);
    td.when(helpers.getUserBalance(td.matchers.anything())).thenResolve([
      { user_balance: 20 },
    ]);
  });

  afterEach(() => {
    td.reset();
  });

  describe("getRecordsHandler", () => {
    const event = {
      queryStringParameters: {
        page: 1,
        limit: 5,
        orderBy: "date",
        direction: "asc",
      },
      headers: {
        authorization: "Bearer 1234",
      },
    };
    const context = {};
    it("should return successful response with the expected response body", async () => {
      const response = await lambda.getRecordsHandler(event, context);
      expect(response.statusCode).to.equal(200);
      expect(response).to.include({
        body: JSON.stringify({
          data: {
            count: [
              {
                total_count: 1,
              },
            ],
            records: [
              {
                id: "123",
                userId: "mockedUserId",
                balance: 250,
                result: "20",
                date: "2023-11-07T00:00:00.000Z",
                cost: 10,
                operationType: "addition",
              },
            ],
          },
        }),
      });
    });

    it("should handle errors", async () => {
      td.when(helpers.getUserIdFromAuth0(td.matchers.anything())).thenReject(
        "",
      );
      const response = await lambda.getRecordsHandler(event, context);
      expect(response).to.throw;
      expect(response.statusCode).to.equal(500);
    });
  });

  describe("createRecordsHandler", () => {
    const event = {
      body: JSON.stringify({
        operationId: 1,
        firstValue: 3,
        secondValue: 2,
      }),
      headers: {
        authorization: "Bearer 1234",
      },
    };
    const context = {};
    it("should return valid response when operation is successfully executed", async () => {
      const response = await lambda.createRecordsHandler(event, context);
      expect(response.statusCode).to.equal(200);
    });

    it("should return 400 statusCode when user has not enough balance", async () => {
      td.when(helpers.getUserBalance(td.matchers.anything())).thenResolve([
        { user_balance: 0 },
      ]);
      const response = await lambda.createRecordsHandler(event, context);
      expect(response.statusCode).to.equal(400);
    });

    it("should handle errors", async () => {
      td.when(helpers.getUserIdFromAuth0(td.matchers.anything())).thenReject(
        "",
      );
      const response = await lambda.createRecordsHandler(event, context);
      expect(response).to.throw;
      expect(response.statusCode).to.equal(500);
    });
  });

  describe("deleteRecordsHandler", () => {
    const event = {
      pathParameters: {
        recordId: "mockRecordId",
      },
      headers: {
        authorization: "Bearer 1234",
      },
    };
    const context = {};
    it("should return valid response when record is successfully deleted", async () => {
      const response = await lambda.deleteRecordsHandler(event, context);
      expect(response.statusCode).to.equal(200);
    });

    it("should handle errors", async () => {
      td.when(helpers.getUserIdFromAuth0(td.matchers.anything())).thenReject(
        "",
      );
      const response = await lambda.deleteRecordsHandler(event, context);
      expect(response).to.throw;
      expect(response.statusCode).to.equal(500);
    });
  });
});
