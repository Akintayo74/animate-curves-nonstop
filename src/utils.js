//Utils
export const clamp = (value, min = 0, max = 1) => {
  if (min > max) {
    [min, max] = [max, min];
  }

  return Math.max(min, Math.min(max, value));
};

export const normalize = (
  value,
  currentScaleMin,
  currentScaleMax,
  newScaleMin = 0,
  newScaleMax = 1,
) => {
  const standardNormalization =
    (value - currentScaleMin) / (currentScaleMax - currentScaleMin);

  return (newScaleMax - newScaleMin) * standardNormalization + newScaleMin;
};

export const clampedNormalize = (
  value,
  currentScaleMin,
  currentScaleMax,
  newScaleMin = 0,
  newScaleMax = 1,
) => {
  return clamp(
    normalize(
      value,
      currentScaleMin,
      currentScaleMax,
      newScaleMin,
      newScaleMax,
    ),
    newScaleMin,
    newScaleMax,
  );
};

// In addition to _linear_ interpolation, I sometimes want to use _exponential_ interpolation, where the input is mapped onto a curved line rather than a straight one. This is beyond the scope of this lesson, but feel free to experiment with this!
export const exponentialNormalize = (
  value,
  currentScaleMin,
  currentScaleMax,
  newScaleMin = 0,
  newScaleMax = 1,
  exponent = 2,
) => {
  const normalizedInput =
    (value - currentScaleMin) / (currentScaleMax - currentScaleMin);

  const exponentialOutput = Math.pow(normalizedInput, exponent);

  return newScaleMin + (newScaleMax - newScaleMin) * exponentialOutput;
};
