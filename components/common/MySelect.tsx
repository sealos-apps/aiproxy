'use client';

import React, { forwardRef, useMemo, useRef } from 'react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import type { BoxProps, ButtonProps } from '@chakra-ui/react';
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  useDisclosure,
  useOutsideClick,
} from '@chakra-ui/react';

interface MySelectProps extends ButtonProps {
  width?: string;
  height?: string;
  value?: string;
  placeholder?: string;
  list: {
    label: string | React.ReactNode;
    value: string;
  }[];
  onchange?: (val: string) => void;
  isInvalid?: boolean;
  boxStyle?: BoxProps;
}

const MySelect = (
  {
    placeholder,
    value,
    width = 'auto',
    height = '30px',
    list,
    onchange,
    isInvalid,
    boxStyle,
    ...props
  }: MySelectProps,
  selectRef: React.ForwardedRef<HTMLButtonElement>
) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const selectWrapperRef = useRef<HTMLDivElement>(null);
  const menuListRef = useRef<HTMLDivElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useOutsideClick({
    ref: selectWrapperRef,
    handler: (event) => {
      if (menuListRef.current?.contains(event.target as Node)) return;
      onClose();
    },
  });

  const activeMenu = useMemo(() => {
    const foundItem = list.find((item) => item.value === value);
    if (!foundItem && value) {
      return {
        label: value,
        value,
      };
    }
    return foundItem;
  }, [list, value]);

  return (
    <Menu autoSelect={false} isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
      <Box
        ref={selectWrapperRef}
        position="relative"
        onClick={() => {
          isOpen ? onClose() : onOpen();
        }}
        {...boxStyle}
      >
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          width={width}
          height={height}
          ref={(node: HTMLButtonElement | null) => {
            buttonRef.current = node;
            if (typeof selectRef === 'function') {
              selectRef(node);
            } else if (selectRef) {
              const mutableRef = selectRef as React.MutableRefObject<HTMLButtonElement | null>;
              mutableRef.current = node;
            }
          }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid #E8EBF0"
          borderRadius="md"
          fontSize="12px"
          fontWeight="400"
          variant="outline"
          _hover={{
            borderColor: 'brightBlue.300',
            bg: 'grayModern.50',
          }}
          _active={{
            transform: '',
          }}
          {...(isOpen
            ? {
                boxShadow: '0px 0px 0px 2.4px rgba(33, 155, 244, 0.15)',
                borderColor: 'brightBlue.500',
                bg: '#FFF',
              }
            : {
                bg: '#F7F8FA',
                borderColor: isInvalid ? 'red' : '',
              })}
          {...props}
        >
          <Flex justifyContent="flex-start">{activeMenu ? activeMenu.label : placeholder}</Flex>
        </MenuButton>

        <Portal>
          <MenuList
            ref={menuListRef}
            minW={(() => {
              const width = buttonRef.current?.clientWidth;
              if (width) {
                return `${width}px !important`;
              }
              return `${props.w || width || 'auto'} !important`;
            })()}
            p="6px"
            borderRadius="base"
            border="1px solid #E8EBF0"
            boxShadow="0px 4px 10px 0px rgba(19, 51, 107, 0.10), 0px 0px 1px 0px rgba(19, 51, 107, 0.10)"
            zIndex={2000}
            overflow="overlay"
            maxH="300px"
          >
            {list.map((item) => (
              <MenuItem
                key={item.value}
                color={value === item.value ? 'brightBlue.600' : undefined}
                borderRadius="4px"
                _hover={{
                  bg: 'rgba(17, 24, 36, 0.05)',
                  color: 'brightBlue.600',
                }}
                p="6px"
                onClick={() => {
                  if (onchange && value !== item.value) {
                    onchange(item.value);
                  }
                }}
              >
                <Box>{item.label}</Box>
              </MenuItem>
            ))}
          </MenuList>
        </Portal>
      </Box>
    </Menu>
  );
};

export default React.memo(forwardRef(MySelect));
