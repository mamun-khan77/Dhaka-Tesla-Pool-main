export function getDhakaCopilotFallbackResponse(
  userQuery: string,
  roleInstruction?: string
): string {
  const q = userQuery.toLowerCase();

  if (q.includes('discount') || q.includes('25%') || q.includes('fare') || q.includes('price') || q.includes('poisha') || q.includes('cost')) {
    return (
      `**Dhaka Tesla Pool Fare & Discount Architecture** ⚡\n\n` +
      `• **Base Fare:** ৳60.00 (6,000 Poisha) standard initiation per vehicle.\n` +
      `• **Distance Rate:** ৳25.00/km (2,500 Poisha per kilometer) computed along real Dhaka corridors.\n` +
      `• **Automatic 25% Pool Discount:** Whenever 2 or 3 passengers share the Tesla "Bullet", each commuter receives an instantaneous **25% discount** off their individual route segment!\n` +
      `• **Zero Surge Guarantee:** Unlike traditional ride-hailing, Dhaka Tesla Pool never increases fares during monsoon rain or peak evening rush hour.\n` +
      `• **Exact Poisha Precision:** Fares are stored as integer Poisha in Firestore and SQLite, preventing floating-point rounding errors.`
    );
  }

  if (q.includes('seat') || q.includes('capacity') || q.includes('bullet') || q.includes('model 3') || q.includes('passenger') || q.includes('3')) {
    return (
      `**Tesla "Bullet" Strict 3-Seat Capacity Rules** 🚗\n\n` +
      `• **Why exactly 3 passengers?** To guarantee maximum executive comfort, individual climate control, and high-speed corridor boarding without cramming.\n` +
      `• **Zero Overcrowding:** The driver is dedicated to navigation and VIP passenger service; the rear and front seats comfortably accommodate up to 3 pooled commuters.\n` +
      `• **Corridor Matching:** Our Finite State Machine matches passengers whose pickup and dropoff points share the same Dhaka corridor (e.g., Banani ➔ Mohakhali ➔ Farmgate) with minimal detour.`
    );
  }

  if (q.includes('route') || q.includes('banani') || q.includes('gulshan') || q.includes('mohakhali') || q.includes('traffic') || q.includes('rush') || q.includes('airport')) {
    return (
      `**Dhaka Rush-Hour Corridor Optimization** 🚦\n\n` +
      `• **Airport Road Spine (Uttara ➔ Banani ➔ Mohakhali):** Busiest between 8:30 AM – 10:30 AM and 5:30 PM – 8:00 PM. Our Tesla fleet prioritizes the Mohakhali Flyover bypass to avoid ground-level bus queues.\n` +
      `• **Gulshan Avenue & Kemal Ataturk:** Connects Gulshan 2, Gulshan 1, and Banani Road 11. Commuters are advised to meet drivers at designated low-congestion bays.\n` +
      `• **Hatirjheel Express Drive:** Ultra-smooth connection from Gulshan 1 Police Plaza towards Karwan Bazar and Dhanmondi, shaving up to 25 minutes off peak commutes.\n` +
      `• **Real-Time Dispatch:** Our drivers track flyover queues and detour through Hatirjheel or Kemal Ataturk when Airport Road reaches standstills.`
    );
  }

  // Default comprehensive copilot response
  return (
    `**Dhaka Tesla Transit Copilot** ⚡\n\n` +
    `Hello! I am your dedicated transit copilot for **Dhaka Tesla Pool**.\n\n` +
    `• **Corridors Covered:** Banani, Gulshan 1 & 2, Mohakhali, Uttara, Mirpur, Dhanmondi, and Farmgate.\n` +
    `• **Transparent Pricing:** ৳60.00 base + ৳25.00/km with an automatic **25% pool discount** when sharing seats.\n` +
    `• **Zero-Surge Policy:** Fixed, fair rates regardless of Dhaka weather or rush hour traffic.\n` +
    `• **Verified Google Maps Pickup:** Search landmarks using the "Maps Grounding" button in the navigation bar to find optimal boarding zones.\n\n` +
    `Ask me about optimal routes, fare breakdowns, or meeting spots around Dhaka!`
  );
}
