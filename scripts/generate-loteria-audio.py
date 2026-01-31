#!/usr/bin/env python3
import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from piper_onnx import Piper

CARD_PATTERN = re.compile(
    r"\{\s*id:\s*(\d+),\s*nameEs:\s*'([^']+)',\s*nameEn:\s*'([^']+)'\s*\}"
)


def load_cards(cards_path: Path):
    text = cards_path.read_text(encoding='utf-8')
    cards = []
    for match in CARD_PATTERN.finditer(text):
        card_id = int(match.group(1))
        name_es = match.group(2)
        name_en = match.group(3)
        cards.append({"id": card_id, "es": name_es, "en": name_en})
    if len(cards) != 54:
        raise RuntimeError(f"Expected 54 cards, found {len(cards)}. Check parser pattern.")
    cards.sort(key=lambda c: c["id"])
    return cards


def synthesize(piper, text):
    samples, sample_rate = piper.create(text, is_phonemes=False)
    samples = np.array(samples, dtype=np.float32)
    return samples, sample_rate


def concat_audio(audio_a, audio_b, sample_rate, silence_ms):
    silence_samples = int(sample_rate * (silence_ms / 1000.0))
    silence = np.zeros(silence_samples, dtype=np.float32)
    return np.concatenate([audio_a, silence, audio_b])


def ensure_ffmpeg():
    return shutil.which('ffmpeg')


def convert_to_mp3(wav_path: Path, mp3_path: Path, bitrate: str):
    ffmpeg = ensure_ffmpeg()
    if not ffmpeg:
        raise RuntimeError('ffmpeg not found. Install it or output WAV instead.')
    subprocess.run(
        [
            ffmpeg,
            '-y',
            '-i',
            str(wav_path),
            '-vn',
            '-ac',
            '1',
            '-ar',
            '22050',
            '-b:a',
            bitrate,
            str(mp3_path)
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )


def main():
    parser = argparse.ArgumentParser(description='Generate Loteria prerecorded audio with Piper ONNX.')
    parser.add_argument('--cards', default='src/scripts/loteria/cards.js')
    parser.add_argument('--es-model', required=True)
    parser.add_argument('--es-config', required=True)
    parser.add_argument('--en-model', required=True)
    parser.add_argument('--en-config', required=True)
    parser.add_argument('--out-dir', default='public/audio/loteria')
    parser.add_argument('--silence-ms', type=int, default=250)
    parser.add_argument('--format', choices=['mp3', 'wav'], default='mp3')
    parser.add_argument('--bitrate', default='64k')
    parser.add_argument('--keep-wav', action='store_true')
    args = parser.parse_args()

    cards_path = Path(args.cards)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    cards = load_cards(cards_path)

    piper_es = Piper(args.es_model, args.es_config)
    piper_en = Piper(args.en_model, args.en_config)

    for card in cards:
        text_es = card['es']
        text_en = card['en']
        samples_es, sr_es = synthesize(piper_es, text_es)
        samples_en, sr_en = synthesize(piper_en, text_en)
        if sr_es != sr_en:
            raise RuntimeError(f"Sample rate mismatch: {sr_es} vs {sr_en}")

        combined = concat_audio(samples_es, samples_en, sr_es, args.silence_ms)
        wav_path = out_dir / f"{card['id']:02d}.wav"
        sf.write(wav_path, combined, sr_es)

        if args.format == 'mp3':
            mp3_path = out_dir / f"{card['id']:02d}.mp3"
            convert_to_mp3(wav_path, mp3_path, args.bitrate)
            if not args.keep_wav:
                wav_path.unlink(missing_ok=True)

    print(f"Generated {len(cards)} files in {out_dir}")


if __name__ == '__main__':
    main()
