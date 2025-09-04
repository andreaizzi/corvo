import { Box, Button, CloseButton, Dialog, Field, FileUpload, Flex, Icon, Input, Portal, Spinner, Stack } from '@chakra-ui/react';
import React from 'react';
import { LuUpload } from 'react-icons/lu';
import type { Recipient } from '../types';

interface UploadFileDialogProps {
    fileName: string;
    fileDescription: string;
    uploadedFile: File | null;
    recipients: Recipient[] | undefined;
    isUploading: boolean;
    isOpen: boolean;
    // isPending: boolean;
    onClose: () => void;
    setFileName: (fileName: string) => void;
    setFileDescription: (description: string) => void;
    setUploadedFile: (file: File | null) => void;
    onUpload: () => void;
}

export const UploadFileDialog: React.FC<UploadFileDialogProps> = ({
    fileName,
    fileDescription,
    uploadedFile,
    // recipients,
    isUploading,
    isOpen,
    // isPending,
    onClose,
    setFileName,
    setFileDescription,
    setUploadedFile,
    onUpload,
}) => {
    // NOTE: all the comments regarding recipients are for a possible future implementation of assigning recipients while uploading the file
    // const [isRecipientsHover, setIsRecipientsHover] = useState<File | null>(null);
    // const [isRecipientsOpen, setIsRecipientsOpen] = useState<File | null>(null);

    // const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

    return (
        <Dialog.Root size="lg" open={isOpen} onOpenChange={(e) => { if (e.open === false) onClose(); }}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Upload file</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <FileUpload.Root
                                maxW="100%"
                                alignItems="stretch"
                                maxFiles={1}
                                onFileChange={(files) => {
                                    if (files.acceptedFiles.length > 0 && files.acceptedFiles[0]) {
                                        setUploadedFile(files.acceptedFiles[0]);
                                        setFileName(files.acceptedFiles[0].name);
                                    } else if (files.acceptedFiles.length === 0) {
                                        setUploadedFile(null);
                                        setFileName("");
                                        setFileDescription("");
                                    }
                                }}
                            >
                                <FileUpload.HiddenInput />
                                <FileUpload.ItemGroup>
                                    <FileUpload.Context>
                                        {({ acceptedFiles }) =>
                                            acceptedFiles.map((file) => (
                                                <FileUpload.Item key={file.name} file={file}>
                                                    <Flex align="center" justify="space-between" width="100%">
                                                        <Box marginEnd="auto">
                                                            <FileUpload.ItemName />
                                                            <FileUpload.ItemSizeText />
                                                        </Box>
                                                        <FileUpload.ItemDeleteTrigger alignSelf="center" color={"red.600"} />
                                                    </Flex>
                                                </FileUpload.Item>
                                            ))
                                        }
                                    </FileUpload.Context>
                                </FileUpload.ItemGroup>
                                {!uploadedFile ? (
                                    <FileUpload.Dropzone>
                                        <Icon size="md" color="fg.muted">
                                            <LuUpload />
                                        </Icon>
                                        <FileUpload.DropzoneContent>
                                            <Box>Drag and drop the file here, or click to select</Box>
                                            <Box color="fg.muted">Support for all file types up to 100MB each</Box>
                                        </FileUpload.DropzoneContent>
                                    </FileUpload.Dropzone>
                                ) : (
                                    <Stack gap={3}>
                                        <Field.Root required>
                                            <Field.Label fontSize="sm" fontWeight="semibold">
                                                Asset Name <Field.RequiredIndicator />
                                            </Field.Label>
                                            <Input
                                                value={fileName}
                                                onChange={(e) => setFileName(e.target.value)}
                                                size="sm"
                                            />
                                        </Field.Root>
                                        <Field.Root>
                                            <Field.Label fontSize="sm" fontWeight="semibold">
                                                Description
                                            </Field.Label>
                                            <Input
                                                value={fileDescription}
                                                onChange={(e) => setFileDescription(e.target.value)}
                                                size="sm"
                                            />
                                        </Field.Root>
                                        {/* TODO: add recipients while uploading the file */}
                                        {/* <Field.Root>
                                            <Field.Label fontSize="sm" fontWeight="semibold">
                                                RECIPIENTS! ps. forse per il momento posso anche evitare e tenere l'assegnazione dei recipients solo una volta caricato il file. mi semplificherebbe abbastanza le cose ora come ora.
                                            </Field.Label>
                                        </Field.Root>
                                        <RecipientSelector
                                            file={uploadedFile}
                                            recipients={recipients}
                                            isHovered={isRecipientsHover as unknown as boolean}
                                            isOpen={isRecipientsOpen as unknown as boolean}
                                            isPending={isPending}
                                            onAssign={(file, event) => {
                                                setSelectedRecipients((prev) => [...prev, event.value]);
                                            }}
                                            onHover={() => setIsRecipientsHover(uploadedFile)}
                                            onOpen={() => setIsRecipientsOpen(uploadedFile)}
                                        /> */}
                                    </Stack>
                                )}
                            </FileUpload.Root>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button
                                disabled={!uploadedFile || !fileName || isUploading}
                                size="md"
                                colorPalette={"red"}
                                onClick={onUpload}
                            >
                                {isUploading ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <LuUpload />
                                )}{" "}
                                Upload
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};