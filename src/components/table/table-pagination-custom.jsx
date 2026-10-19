import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';


export function TablePaginationCustom({
  sx,
  dense,
  onChangeDense,
  rowsPerPageOptions = [5, 10, 25],
  ...other
}) {
  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        {...other}
        sx={{
          borderTopColor: 'transparent',
          overflowX: 'auto',
          '& .MuiTablePagination-toolbar': {
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-end' },
            gap: { xs: 0.5, sm: 0 },
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2 },
          },
          '& .MuiTablePagination-spacer': {
            display: { xs: 'none', sm: 'block' },
          },
          '& .MuiTablePagination-selectLabel': {
            margin: 0,
          },
          '& .MuiTablePagination-displayedRows': {
            margin: 0,
          },
        }}
      />

      {onChangeDense && (
        <FormControlLabel
          label="Dense"
          control={<Switch name="dense" checked={dense} onChange={onChangeDense} />}
          sx={{
            pl: 2,
            py: 1.5,
            top: 0,
            position: { sm: 'absolute' },
          }}
        />
      )}
    </Box>
  );
}
