import { performOperation } from "../../helpers.mjs";
import { expect } from "chai";

describe("Records helper functions", () => {
  describe("performOperation", () => {
    it("should perform the addition operation", async () => {
      const result = await performOperation(1, 2, "addition");
      expect(result).to.equal("3.00");
    });

    it("should perform the subtraction operation", async () => {
      const result = await performOperation(5, 1, "subtraction");
      expect(result).to.equal("4.00");
    });

    it("should perform the multiplication operation", async () => {
      const result = await performOperation(5, 5, "multiplication");
      expect(result).to.equal("25.00");
    });

    it("should perform the division operation", async () => {
      const result = await performOperation(5, 5, "division");
      expect(result).to.equal("1.00");
    });

    it("should perform the square root operation", async () => {
      const result = await performOperation(9, 0, "square_root");
      expect(result).to.equal("3.00");
    });
  });
});
