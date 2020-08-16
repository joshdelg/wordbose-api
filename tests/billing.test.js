import calculateCost from '../libs/billing-lib';

test("Minimum duration", () => {
    const duration = 15 * 60; //15:00

    const cost = 50;
    const calculatedCost = calculateCost(duration);

    expect(cost).toEqual(calculatedCost);
})

test("Minimum charge", () => {
    const duration = (15 * 60 )+ 1; //15:01

    const cost = 50;
    const calculatedCost = calculateCost(duration);

    expect(cost).toEqual(calculatedCost);
});

test("Floor minutes", () => {
    const duration = (20 * 60) + 59; //20:59 20 => 50 21 => 60

    const cost = 50;
    const calculatedCost = calculateCost(duration);

    expect(cost).toEqual(calculatedCost);
})

test("Main pricing scheme", () => {
    const duration = (37 * 60) + 12; //37:12

    const cost = 220;
    const calculatedCost = calculateCost(duration);

    expect(cost).toEqual(calculatedCost);
})