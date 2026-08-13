import Decimal from "decimal.js";

export const CALCULATION_DECIMAL_PLACES = 10;

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -40,
  toExpPos: 40,
});

type CalculationValue = Decimal.Value;

function toDecimal(value: CalculationValue) {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function decimal10(value: CalculationValue) {
  return toDecimal(value)
    .toDecimalPlaces(CALCULATION_DECIMAL_PLACES, Decimal.ROUND_HALF_UP)
    .toNumber();
}

export function add10(...values: CalculationValue[]) {
  let sum = new Decimal(0);
  for (const value of values) {
    sum = sum.plus(value);
  }
  return decimal10(sum);
}

export function subtract10(left: CalculationValue, right: CalculationValue) {
  return decimal10(toDecimal(left).minus(right));
}

export function multiply10(...values: CalculationValue[]) {
  let product = new Decimal(1);
  for (const value of values) {
    product = product.times(value);
  }
  return decimal10(product);
}

export function divide10(numerator: CalculationValue, denominator: CalculationValue) {
  const divisor = toDecimal(denominator);
  return divisor.isZero() ? 0 : decimal10(toDecimal(numerator).dividedBy(divisor));
}

export function divideDown10(numerator: CalculationValue, denominator: CalculationValue) {
  const divisor = toDecimal(denominator);
  return divisor.isZero()
    ? 0
    : toDecimal(numerator)
        .dividedBy(divisor)
        .toDecimalPlaces(CALCULATION_DECIMAL_PLACES, Decimal.ROUND_DOWN)
        .toNumber();
}

export function floorToMultiple10(value: CalculationValue, multiple: CalculationValue) {
  const divisor = toDecimal(multiple);
  if (divisor.lte(0)) return decimal10(value);
  return decimal10(toDecimal(value).dividedBy(divisor).floor().times(divisor));
}

export function multiplyDivide10(
  firstFactor: CalculationValue,
  secondFactor: CalculationValue,
  denominator: CalculationValue
) {
  const divisor = toDecimal(denominator);
  return divisor.isZero()
    ? 0
    : decimal10(toDecimal(firstFactor).times(secondFactor).dividedBy(divisor));
}

export function compareDecimal(left: CalculationValue, right: CalculationValue) {
  return toDecimal(left).comparedTo(right);
}

export function max10(left: CalculationValue, right: CalculationValue) {
  return decimal10(Decimal.max(toDecimal(left), toDecimal(right)));
}

export function roundDecimalInteger(value: CalculationValue) {
  return toDecimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}
