export default function calculatePrice(seconds) {
    // Currency in smallest amount
    // Assume route only called if transcript is over threshold
    // Price: 10c per min after free threshold (15 mins) with a minimum of 50c
    const totalMins = Math.floor(seconds / 60);
    const chargedMins = totalMins - 15;
    const price = Math.max(50, chargedMins * 10);

    return price;
};