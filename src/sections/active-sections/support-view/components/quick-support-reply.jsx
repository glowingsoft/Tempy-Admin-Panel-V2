import React from 'react'
import { Dialog, DialogTitle, DialogContent, Button, DialogActions } from '@mui/material';
import { Form, RHFTextField } from 'src/components/hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '@mui/lab';
import { z as zod } from 'zod';

const QuickSupportReply = ({ open, onclose }) => {

    const schema = zod.object({
        message: zod.string().min(1, 'Message is required')
    });

    const methods = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            message: ''
        }
    });
    const handleClose=()=>{
        onclose();
        methods.reset();
    }

    const onSubmit = (data) => {
        console.log(data);
    }
    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <Form methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
                <DialogTitle sx={{pb:0}}>Reply </DialogTitle>
                <DialogContent>
                    <RHFTextField name="message" label="Message" multiline rows={3} sx={{mt:2}} />
                </DialogContent>
             <DialogActions>
                   <Button variant='outlined' onClick={handleClose}>Cancel</Button>
                <LoadingButton type="submit" variant="contained" color="primary">Send</LoadingButton>
             </DialogActions>
            </Form>
        </Dialog>
    )
}

export default QuickSupportReply