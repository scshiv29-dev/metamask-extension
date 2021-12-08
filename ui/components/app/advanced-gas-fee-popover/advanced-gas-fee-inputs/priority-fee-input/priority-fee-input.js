import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { HIGH_FEE_WARNING_MULTIPLIER } from '../../../../../pages/send/send.constants';
import { PRIORITY_LEVELS } from '../../../../../../shared/constants/gas';
import { SECONDARY } from '../../../../../helpers/constants/common';
import { decGWEIToHexWEI } from '../../../../../helpers/utils/conversions.util';
import { getAdvancedGasFeeValues } from '../../../../../selectors';
import { useCurrencyDisplay } from '../../../../../hooks/useCurrencyDisplay';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../../hooks/useUserPreferencedCurrency';
import FormField from '../../../../ui/form-field';
import { bnGreaterThan, bnLessThan } from '../../../../../helpers/utils/util';

import { useAdvancedGasFeePopoverContext } from '../../context';
import AdvancedGasFeeInputSubtext from '../../advanced-gas-fee-input-subtext';

const validatePriorityFee = (value, gasFeeEstimates) => {
  if (value < 1) {
    return 'editGasMaxPriorityFeeBelowMinimumV2';
  }
  if (
    gasFeeEstimates?.low &&
    bnLessThan(value, gasFeeEstimates.low.suggestedMaxPriorityFeePerGas)
  ) {
    return 'editGasMaxPriorityFeeLowV2';
  }
  if (
    gasFeeEstimates?.high &&
    bnGreaterThan(
      value,
      gasFeeEstimates.high.suggestedMaxPriorityFeePerGas *
        HIGH_FEE_WARNING_MULTIPLIER,
    )
  ) {
    return 'editGasMaxPriorityFeeHighV2';
  }
  return null;
};

const PriorityFeeInput = () => {
  const t = useI18nContext();
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  const {
    setDirty,
    setHasError,
    setMaxPriorityFeePerGas,
  } = useAdvancedGasFeePopoverContext();
  const {
    estimateUsed,
    gasFeeEstimates,
    maxPriorityFeePerGas,
  } = useGasFeeContext();
  const {
    latestPriorityFeeRange,
    historicalPriorityFeeRange,
  } = gasFeeEstimates;
  const [lowLatest, highLatest] = latestPriorityFeeRange;
  const [lowHistorical, highHistorical] = historicalPriorityFeeRange;
  const [priorityFeeError, setPriorityFeeError] = useState();

  const [priorityFee, setPriorityFee] = useState(() => {
    if (
      estimateUsed !== PRIORITY_LEVELS.CUSTOM &&
      advancedGasFeeValues?.priorityFee
    )
      return advancedGasFeeValues.priorityFee;
    return maxPriorityFeePerGas;
  });

  const { currency, numberOfDecimals } = useUserPreferencedCurrency(SECONDARY);

  const [, { value: priorityFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(priorityFee),
    { currency, numberOfDecimals },
  );

  const updatePriorityFee = (value) => {
    setPriorityFee(value);
    setDirty(true);
  };

  useEffect(() => {
    setMaxPriorityFeePerGas(priorityFee);
    const error = validatePriorityFee(priorityFee, gasFeeEstimates);
    setPriorityFeeError(error);
    setHasError(Boolean(error));
  }, [
    gasFeeEstimates,
    priorityFee,
    setHasError,
    setMaxPriorityFeePerGas,
    setPriorityFeeError,
  ]);

  return (
    <>
      <FormField
        error={priorityFeeError ? t(priorityFeeError) : ''}
        onChange={updatePriorityFee}
        titleText={t('priorityFeeProperCase')}
        titleUnit="(GWEI)"
        tooltipText={t('advancedPriorityFeeToolTip')}
        value={priorityFee}
        detailText={`≈ ${priorityFeeInFiat}`}
        numeric
      />
      <AdvancedGasFeeInputSubtext
        latest={`${parseFloat(lowLatest).toFixed(2)} - ${parseFloat(
          highLatest,
        ).toFixed(2)} GWEI`}
        historical={`${parseFloat(lowHistorical).toFixed(2)} - ${parseFloat(
          highHistorical,
        ).toFixed(2)} GWEI`}
      />
    </>
  );
};

export default PriorityFeeInput;
