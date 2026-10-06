export interface AgreementTerm {
  code: string;
  required: boolean;
}

export function getAgreementState(
  terms: readonly AgreementTerm[],
  agreements: Readonly<Record<string, boolean>>,
) {
  const requiredTerms = terms.filter(term => term.required);
  const requiredSatisfied = requiredTerms.every(
    term => agreements[term.code] === true,
  );

  return {
    allChecked:
      terms.length > 0 &&
      terms.every(term => agreements[term.code] === true),
    requiredSatisfied,
    essentialOnlyChecked:
      requiredTerms.length > 0 &&
      requiredSatisfied &&
      terms
        .filter(term => !term.required)
        .every(term => agreements[term.code] !== true),
  };
}
