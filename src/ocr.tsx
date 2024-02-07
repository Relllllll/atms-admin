import React, { useState, useEffect, useRef } from 'react';
import {
  Group,
  Stack,
  Text,
  Image,
  Progress,
  Button,
  Box
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { createWorker } from 'tesseract.js';

interface SectionProps {
  children: React.ReactNode;
  active?: boolean;
}


const Section = ({ children, active = false }: SectionProps ) => {
  return (
    <Box
      sx={{
        backgroundColor: active ? 'lightblue' : 'white',
        padding: '10px',
        borderRadius: 'md',
        marginBottom: '10px',
      }}
    >
      {children}
    </Box>
  );
};

const Home = () => {
  const [formInput, setFormInput] = useState('');
  const [imageData, setImageData] = useState<null | string>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('idle');
  const [ocrLines, setOcrLines] = useState<string[]>([]);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);

  const workerRef = useRef<Tesseract.Worker | null>(null);

  useEffect(() => {
    workerRef.current = createWorker({
      logger: (message) => {
        if ('progress' in message) {
          setProgress(message.progress);
          setProgressLabel(message.progress == 1 ? 'Done' : message.status);
        }
      },
    });
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUri = reader.result;
      setImageData(imageDataUri as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    setProgress(0);
    setProgressLabel('starting');

    const worker = workerRef.current!;
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const response = await worker.recognize(imageData!);
    const lines = response.data.text.split("\n");
    setOcrLines(lines);
    setSelectedSectionIndex(0);
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormInput(event.target.value);
  };

  useEffect(() => {
    setFormInput(ocrLines[selectedSectionIndex]);
  }, [selectedSectionIndex, ocrLines]);

  return (
    <>
      <Group align='initial' style={{ padding: '10px' }}>
        <Stack style={{ flex: '1' }}>
          <Dropzone
            onDrop={(files) => loadFile(files[0])}
            accept={IMAGE_MIME_TYPE}
            multiple={false}
          >
            {() => (
              <Text size="xl" inline>
                Drag image here or click to select file
              </Text>
            )}
          </Dropzone>

          {!!imageData && <Image src={imageData} style={{ width: '100%' }} />}
        </Stack>

        <Stack style={{ flex: '1' }}>
          <Button disabled={!imageData || !workerRef.current} onClick={handleExtract}>
            Extract
          </Button>
          <Text>{progressLabel.toUpperCase()}</Text>
          <Progress value={progress * 100} />

          <Stack>
            {ocrLines.map((line, index) => (
              <Section key={index} active={index === selectedSectionIndex}>
                <Text>{line}</Text>
              </Section>
            ))}
          </Stack>

          <form>
            <input
              type="text"
              value={formInput}
              onChange={handleFormChange}
              placeholder="Enter your information"
            />
          </form>

          <Button
            onClick={() => setSelectedSectionIndex((prevIndex) => (prevIndex + 1) % ocrLines.length)}
          >
            Next Section
          </Button>
        </Stack>
      </Group> {/* Closing tag for the Group component */}
    </>
  );
};


export default Home;