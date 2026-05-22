import { notFound } from 'next/navigation';
import { getSchedule } from '@/lib/data';
import { getSessionsForSpeaker, getSpeakerByNickname, listSpeakers } from '@/lib/queries/speakers';
import { PushHeader } from '@/components/server/PushHeader';
import { Avatar } from '@/components/server/Avatar';
import { SocialIconRow } from '@/components/server/SocialIconRow';
import { Abstract } from '@/components/server/Abstract';
import { SessionCard } from '@/components/server/SessionCard';
import type { Speaker } from '@/lib/data/schema';

interface PageProps {
  params: Promise<{ nickname: string }>;
}

export function generateStaticParams() {
  const schedule = getSchedule();
  return listSpeakers(schedule).map((sp) => ({ nickname: sp.nickname }));
}

function tintFor(nickname: string): string {
  let h = 0;
  for (let i = 0; i < nickname.length; i++) h = (h * 31 + nickname.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 70% 60% / 0.22)`;
}

export default async function SpeakerProfilePage({ params }: PageProps) {
  const { nickname } = await params;
  const schedule = getSchedule();
  const speaker = getSpeakerByNickname(schedule, nickname);
  if (!speaker) notFound();

  const sessions = getSessionsForSpeaker(schedule, speaker.id);
  const speakersById = new Map<number, Speaker>(schedule.speakers.map((s) => [s.id, s]));
  const tint = tintFor(speaker.nickname);
  const tagline = [speaker.company, speaker.location].filter(Boolean).join(' · ');

  return (
    <>
      <PushHeader backHref="/speakers" transparent />
      <div
        style={{
          background: `radial-gradient(circle at 50% -20%, ${tint} 0%, transparent 60%)`,
          padding: '8px 16px 28px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Avatar url={speaker.avatar} name={speaker.name} size={88} />
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: -0.6,
            lineHeight: 1.2,
            margin: 0,
            color: 'var(--color-text)',
          }}
        >
          {speaker.name}
        </h1>
        {tagline ? (
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-muted)' }}>
            {tagline}
          </div>
        ) : null}
        <SocialIconRow speaker={speaker} />
      </div>

      {speaker.bio ? (
        <section style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SectionLabel>Bio</SectionLabel>
          <Abstract html={speaker.bio} />
        </section>
      ) : null}

      {sessions.length > 0 ? (
        <section style={{ padding: '0 0 32px' }}>
          <div style={{ padding: '0 16px 8px' }}>
            <SectionLabel>Sessions</SectionLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((session) => {
              const sps = session.speakerIds
                .map((id) => speakersById.get(id))
                .filter((s): s is Speaker => s !== undefined);
              return (
                <SessionCard key={session.id} session={session} speakers={sps} />
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
      }}
    >
      {children}
    </div>
  );
}
