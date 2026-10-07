import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { _mock } from 'src/_mock';
import { _addressBooks } from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { AddressListDialog, AddressNewForm } from '../address';

// ----------------------------------------------------------------------

export function InvoiceNewEditAddress() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const mdUp = useResponsive('up', 'md');

  const values = watch();

  const { invoiceFrom, invoiceTo } = values;

  const from = useBoolean();
  const to = useBoolean();
  const newAddressForm = useBoolean();

  const [addressBook, setAddressBook] = useState(_addressBooks);
  const [newAddressFor, setNewAddressFor] = useState(null);

  const handleOpenNewAddress = useCallback(
    (target) => {
      setNewAddressFor(target);
      from.onFalse();
      to.onFalse();
      newAddressForm.onTrue();
    },
    [from, to, newAddressForm]
  );

  const handleCreateAddress = useCallback(
    (address) => {
      const newEntry = {
        ...address,
        id: _mock.id(Date.now()),
        company: address.company || address.name,
        email: address.email || '',
      };

      setAddressBook((prev) => [newEntry, ...prev]);

      if (newAddressFor === 'from') {
        setValue('invoiceFrom', newEntry);
      } else {
        setValue('invoiceTo', newEntry);
      }

      toast.success('Customer added');
      newAddressForm.onFalse();
      setNewAddressFor(null);
    },
    [newAddressFor, newAddressForm, setValue]
  );

  return (
    <>
      <Stack
        spacing={{ xs: 3, md: 5 }}
        direction={{ xs: 'column', md: 'row' }}
        divider={
          <Divider
            flexItem
            orientation={mdUp ? 'vertical' : 'horizontal'}
            sx={{ borderStyle: 'dashed' }}
          />
        }
        sx={{ p: 3 }}
      >
        <Stack sx={{ width: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              From:
            </Typography>

            <IconButton onClick={from.onTrue}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">{invoiceFrom.name}</Typography>
            <Typography variant="body2">{invoiceFrom.fullAddress}</Typography>
            <Typography variant="body2"> {invoiceFrom.phoneNumber}</Typography>
          </Stack>
        </Stack>

        <Stack sx={{ width: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              To:
            </Typography>

            <IconButton onClick={to.onTrue}>
              <Iconify icon={invoiceTo ? 'solar:pen-bold' : 'mingcute:add-line'} />
            </IconButton>
          </Stack>

          {invoiceTo ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2">{invoiceTo.name}</Typography>
              <Typography variant="body2">{invoiceTo.fullAddress}</Typography>
              <Typography variant="body2"> {invoiceTo.phoneNumber}</Typography>
            </Stack>
          ) : (
            <Typography typography="caption" sx={{ color: 'error.main' }}>
              {errors.invoiceTo?.message}
            </Typography>
          )}
        </Stack>
      </Stack>

      <AddressListDialog
        title="Customers"
        open={from.value}
        onClose={from.onFalse}
        selected={(selectedId) => invoiceFrom?.id === selectedId}
        onSelect={(address) => setValue('invoiceFrom', address)}
        list={addressBook}
        action={
          <Button
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ alignSelf: 'flex-end' }}
            onClick={() => handleOpenNewAddress('from')}
          >
            New
          </Button>
        }
      />

      <AddressListDialog
        title="Customers"
        open={to.value}
        onClose={to.onFalse}
        selected={(selectedId) => invoiceTo?.id === selectedId}
        onSelect={(address) => setValue('invoiceTo', address)}
        list={addressBook}
        action={
          <Button
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ alignSelf: 'flex-end' }}
            onClick={() => handleOpenNewAddress('to')}
          >
            New
          </Button>
        }
      />

      <AddressNewForm
        open={newAddressForm.value}
        onClose={() => {
          newAddressForm.onFalse();
          setNewAddressFor(null);
        }}
        onCreate={handleCreateAddress}
      />
    </>
  );
}
