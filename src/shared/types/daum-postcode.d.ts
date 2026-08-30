interface DaumPostcodeResult {
  zonecode: string;
  address: string;
}

interface DaumPostcodeOptions {
  oncomplete: (result: DaumPostcodeResult) => void;
}

interface Window {
  daum?: {
    Postcode: new (options: DaumPostcodeOptions) => {
      open: () => void;
    };
  };
}
