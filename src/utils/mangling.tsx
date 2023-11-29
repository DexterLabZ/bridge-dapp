export function mangle(input: string, secret: string): string {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i) ^ secret.charCodeAt(i % secret.length);
    output += String.fromCharCode(charCode);
  }
  // Convert the output to a hexadecimal string
  return output
    .split("")
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

export function unmangle(input: string, secret: string): string {
  // Convert the input from a hexadecimal string
  const decodedInput =
    input
      .match(/.{1,2}/g)
      ?.map((byte) => String.fromCharCode(parseInt(byte, 16)))
      .join("") || "";
  let output = "";
  for (let i = 0; i < decodedInput.length; i++) {
    const charCode = decodedInput.charCodeAt(i) ^ secret.charCodeAt(i % secret.length);
    output += String.fromCharCode(charCode);
  }
  return output;
}
