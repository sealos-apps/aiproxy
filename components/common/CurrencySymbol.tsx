'use client';

import type { BoxProps } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
import {
  CurrencySymbol as LabringCurrencySymbol,
  type CurrencySymbolProps as LabringCurrencySymbolProps,
} from '@labring/sealos-ui';

type CurrencySymbolProps = Omit<BoxProps, 'type'> &
  Pick<LabringCurrencySymbolProps, 'type' | 'shellCoin'>;

export function CurrencySymbol({ type, shellCoin, ...props }: CurrencySymbolProps) {
  return (
    <Box as="span" display="inline-flex" alignItems="center" {...props}>
      <LabringCurrencySymbol type={type} shellCoin={shellCoin} />
    </Box>
  );
}
