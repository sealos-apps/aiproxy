import { extendTheme } from '@chakra-ui/react'

const colors = {
  grayModern: {
    '05': 'rgba(17, 24, 36, 0.05)',
    1: 'rgba(17, 24, 36, 0.1)',
    15: 'rgba(17, 24, 36, 0.15)',
    25: '#FBFBFC',
    50: '#F7F8FA',
    100: '#F4F4F7',
    150: '#F0F1F6',
    200: '#E8EBF0',
    250: '#DFE2EA',
    300: '#C4CBD7',
    400: '#8A95A7',
    500: '#667085',
    600: '#485264',
    700: '#383F50',
    800: '#1D2532',
    900: '#111824',
  },
  brightBlue: {
    25: '#F9FDFE',
    50: '#F0FBFF',
    100: '#DBF3FF',
    200: '#BCE7FF',
    300: '#85CCFF',
    400: '#47B2FF',
    500: '#219BF4',
    600: '#0884DD',
    700: '#0770BC',
    800: '#005B9C',
    900: '#004B82',
  },
  boxShadowBlue: '0px 0px 0px 2.4px rgba(33, 155, 244, 0.15)',
  buttonBoxShadow:
    '0px 1px 2px 0px rgba(19, 51, 107, 0.05), 0px 0px 1px 0px rgba(19, 51, 107, 0.08)',
}

export const theme = extendTheme({
  colors,
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Helvetica, Arial, "Noto Sans SC", sans-serif',
    heading:
      '-apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Helvetica, Arial, "Noto Sans SC", sans-serif',
    mono: 'Menlo, monospace',
  },
  fontSizes: {
    sm: '10px',
    base: '12px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
  },
  fontWeights: {
    bold: 500,
  },
  radii: {
    xs: '1px',
    sm: '2px',
    base: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
  },
  borders: {
    150: '1px solid #F0F1F6',
    200: '1px solid #E8EBF0',
    base: '1px solid #E8EBF0',
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: colors.grayModern[900],
          color: '#FFF',
          borderRadius: 'md',
          fontWeight: 500,
          boxShadow: colors.buttonBoxShadow,
          _hover: {
            opacity: '0.9',
            bg: colors.grayModern[900],
            _disabled: {
              bg: colors.grayModern[900],
              opacity: '0.4',
            },
          },
          _active: {
            bg: '',
          },
        },
        outline: {
          bg: '#FFF',
          borderRadius: 'md',
          fontWeight: 500,
          border: '1px solid',
          borderColor: 'grayModern.250',
          boxShadow: colors.buttonBoxShadow,
          color: 'grayModern.600',
          minW: '16px',
          minH: '16px',
          _hover: {
            opacity: '0.9',
            bg: 'rgba(33, 155, 244, 0.05)',
            color: 'brightBlue.700',
            borderColor: 'brightBlue.300',
          },
          _active: {
            bg: '',
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            width: '300px',
            fontSize: '12px',
            fontWeight: 400,
            height: '32px',
            borderRadius: 'md',
            border: '1px solid',
            borderColor: '#E8EBF0',
            bg: colors.grayModern[50],
            _focusVisible: {
              borderColor: colors.brightBlue[500],
              boxShadow: colors.boxShadowBlue,
              bg: '#FFF',
              color: '#111824',
            },
            _disabled: {
              color: '#8A95A7',
              bg: '#FBFBFC',
              _hover: {},
            },
            _hover: {
              borderColor: colors.brightBlue[300],
              bg: colors.grayModern[50],
            },
            _invalid: {
              bg: '#FFF',
              borderColor: '#D92D20',
              boxShadow: '0px 0px 0px 2.4px rgba(217, 45, 32, 0.15)',
            },
            _placeholder: {
              color: '#667085',
              fontSize: '12px',
              fontWeight: 400,
              lineHeight: '16px',
            },
          },
        },
      },
      defaultProps: {
        size: 'md',
        variant: 'outline',
      },
    },
    Textarea: {
      variants: {
        outline: {
          border: '1px solid',
          bg: 'grayModern.50',
          borderRadius: 'md',
          borderColor: '#E8EBF0',
          _focusVisible: {
            borderColor: colors.brightBlue[500],
            boxShadow: colors.boxShadowBlue,
            bg: '#FFF',
            color: '#111824',
          },
        },
      },
      defaultProps: {
        size: 'md',
        variant: 'outline',
      },
    },
    Modal: {
      baseStyle: {
        header: {
          bg: '#FBFBFC',
          borderTopRadius: '10px',
          borderBottom: '1px solid #F4F4F7',
          fontSize: '16px',
          color: 'grayModern.900',
          fontWeight: '500',
          py: '11.5px',
          lineHeight: '24px',
        },
        closeButton: {
          fill: '#111824',
          svg: {
            width: '12px',
            height: '12px',
          },
        },
        dialog: {
          borderRadius: '10px',
        },
        body: {
          px: '36px',
          py: '24px',
        },
        footer: {
          px: '36px',
          pb: '24px',
          pt: '0px',
        },
      },
    },
  },
  styles: {
    global: {
      'html, body': {
        color: 'var(--foreground)',
        background: 'var(--background)',
        fontSize: 'md',
        height: '100%',
        overflowY: 'auto',
        fontWeight: 400,
        minWidth: '700px',
      },
    },
  },
})
