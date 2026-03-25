import argparse
import riva.client
import sys

def transcribe_file(server, input_file):
    try:
        # Connect to Riva server
        auth = riva.client.Auth(uri=server)
        riva_asr = riva.client.ASRService(auth)
        
        # Read the normalized WAV file
        with open(input_file, 'rb') as f:
            audio_data = f.read()
            
        # Configure ASR (Match the 16kHz Mono PCM from Node/FFmpeg)
        config = riva.client.RecognitionConfig(
            encoding=riva.client.AudioEncoding.LINEAR_PCM,
            sample_rate_hertz=16000,
            language_code="en-US",
            max_alternatives=1,
            enable_automatic_punctuation=True,
        )
        
        # Perform offline recognition
        response = riva_asr.offline_recognize(audio_data, config)
        
        if response.results:
            # Combine transcripts from all segments
            transcript = " ".join([res.alternatives[0].transcript for res in response.results])
            print(transcript.strip())
        else:
            print("")
            
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--server", default="localhost:50051")
    parser.add_argument("--input-file", required=True)
    args = parser.parse_args()
    
    transcribe_file(args.server, args.input_file)
