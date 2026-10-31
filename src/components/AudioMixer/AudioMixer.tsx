import { useMemo, useState } from 'react';
import { cx } from '@linaria/core';
import { useEditorStore } from '../../store/editorStore';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  MixerContent,
  Channel,
  ChannelName,
  FaderTrack,
  FaderLevel,
  FaderKnob,
  FaderKnobLine,
  FaderValue,
  MeterContainer,
  MeterChannel,
  MeterFill,
  ChannelButtons,
  ChannelBtn,
  ChannelBtnActive,
  MasterSection,
} from './AudioMixer.styles';

export default function AudioMixer() {
  const { tracks, toggleMuteTrack, playback } = useEditorStore();
  const [levels] = useState<Record<number, number>>({ 0: 75, 1: 60, 2: 45, 3: 50 });

  const audioTracks = useMemo(
    () => tracks.filter((t) => t.type === 'audio').sort((a, b) => a.index - b.index),
    [tracks]
  );

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Audio Mixer</PanelTitle>
      </PanelHeader>

      <MixerContent>
        {audioTracks.map((track) => (
          <Channel key={track.id}>
            <MeterContainer>
              <MeterChannel>
                <MeterFill
                  style={{ height: `${levels[track.index] || 0}%` }}
                />
              </MeterChannel>
              <MeterChannel>
                <MeterFill
                  style={{ height: `${(levels[track.index] || 0) * 0.9}%` }}
                />
              </MeterChannel>
            </MeterContainer>

            <FaderTrack>
              <FaderLevel
                style={{ height: `${levels[track.index] || 0}%` }}
              />
              <FaderKnob
                style={{ bottom: `calc(${levels[track.index] || 0}% - 6px)` }}
              >
                <FaderKnobLine />
              </FaderKnob>
            </FaderTrack>

            <FaderValue>
              {track.muted ? '-∞' : `${Math.round(((levels[track.index] || 0) / 100) * 24 - 24)}dB`}
            </FaderValue>

            <ChannelButtons>
              <ChannelBtn
                className={cx(track.muted && ChannelBtnActive)}
                onClick={() => toggleMuteTrack(track.index)}
              >
                M
              </ChannelBtn>
              <ChannelBtn>S</ChannelBtn>
            </ChannelButtons>

            <ChannelName>{track.name}</ChannelName>
          </Channel>
        ))}

        <Channel className={cx(MasterSection)}>
          <MeterContainer>
            <MeterChannel>
              <MeterFill
                style={{ height: `${playback.volume * 100}%` }}
              />
            </MeterChannel>
            <MeterChannel>
              <MeterFill
                style={{ height: `${playback.volume * 90}%` }}
              />
            </MeterChannel>
          </MeterContainer>

          <FaderTrack>
            <FaderLevel
              style={{ height: `${playback.volume * 100}%` }}
            />
            <FaderKnob
              style={{ bottom: `calc(${playback.volume * 100}% - 6px)` }}
            >
              <FaderKnobLine />
            </FaderKnob>
          </FaderTrack>

          <FaderValue>
            {Math.round(playback.volume * 100)}%
          </FaderValue>

          <ChannelName>Master</ChannelName>
        </Channel>
      </MixerContent>
    </Panel>
  );
}
