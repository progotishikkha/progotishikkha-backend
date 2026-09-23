import { calculateDonationAmount, DONATION_PERCENTAGE } from "../src/services/donation.service";

describe("Donation business logic", () => {
  it("calculates 10% of first-month salary", () => {
    expect(calculateDonationAmount(10000, 10)).toBe(1000);
    expect(calculateDonationAmount(8500, 10)).toBe(850);
  });

  it("defaults to the platform's fixed 10% when no percentage is passed", () => {
    expect(DONATION_PERCENTAGE).toBe(10);
    expect(calculateDonationAmount(10000)).toBe(1000);
  });

  it("supports the configured percentage explicitly", () => {
    expect(calculateDonationAmount(12000, 5)).toBe(600);
  });
});
