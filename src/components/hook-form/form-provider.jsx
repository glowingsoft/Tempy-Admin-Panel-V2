import { FormProvider as RHFForm } from 'react-hook-form';

// ----------------------------------------------------------------------

export function Form({ children, onSubmit, methods, id, ...other }) {
  return (
    <RHFForm {...methods}>
      <form id={id} onSubmit={onSubmit} noValidate autoComplete="off" {...other}>
        {children}
      </form>
    </RHFForm>
  );
}
