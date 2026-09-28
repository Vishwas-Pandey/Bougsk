// Legal/registration details from the GST Registration Certificate (Form GST REG-06).
// Used for the required seller-identity disclosure on /policies and the footer —
// not editorial copy, so keep it verbatim rather than paraphrasing.
export const businessInfo = {
  brandName: "Bougsk",
  tradeName: "Virevia Industries",
  legalName: "Vishwas Pandey",
  constitution: "Proprietorship",
  gstin: "07GOBPP2466A1Z4",
  address: {
    line1: "Kh No. 30/16, Uttarakhand Enclave, Gali Number 25",
    locality: "Burari",
    city: "New Delhi",
    district: "Central Delhi",
    state: "Delhi",
    pincode: "110084",
  },
};

export function formatRegisteredAddress(): string {
  const a = businessInfo.address;
  return `${a.line1}, ${a.locality}, ${a.city} ${a.pincode}, ${a.state}`;
}
