import { useCallback, useState } from 'react';
import { useBoolean } from 'src/hooks/use-boolean';
import { toast } from 'src/components/snackbar';

export function useDeleteConfirmation(deleteMutation, options = {}) {
    const {
        successMessage = 'Item deleted successfully!',
        errorMessage = 'Failed to delete item',
        entityName = 'item',
    } = options;

    const confirm = useBoolean();
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteItem, { isLoading: isDeleting }] = deleteMutation();

    const handleDeleteRow = useCallback(
        (id, name) => {
            setItemToDelete({ id, name });
            confirm.onTrue();
        },
        [confirm]
    );

    const handleConfirmDelete = useCallback(async () => {
        if (!itemToDelete) return;

        try {
            await deleteItem(itemToDelete.id).unwrap();
            toast.success(successMessage);
            confirm.onFalse();
            setItemToDelete(null);
        } catch (error) {
            toast.error(error?.data?.message || errorMessage);
            console.error('Delete error:', error);
        }
    }, [deleteItem, itemToDelete, confirm, successMessage, errorMessage]);

    const handleCancelDelete = useCallback(() => {
        if (!isDeleting) {
            confirm.onFalse();
            setItemToDelete(null);
        }
    }, [confirm, isDeleting]);

    return {
        confirm,
        itemToDelete,
        isDeleting,
        handleDeleteRow,
        handleConfirmDelete,
        handleCancelDelete,
    };
}