import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'


const MEMBER_COLORS = {
  Yura: '#8b5cf6',
  Faker: '#3b82f6',
  '0xGiant': '#06b6d4',
  Rape: '#ef4444',
  Voldmot: '#f59e0b',
  john: '#64748b',
}

const getMemberColor = (memberName) => {
  return MEMBER_COLORS[memberName] || '#64748b'
}


const Calendar = () => {

  const [rawEvents, setRawEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [visibleRange, setVisibleRange] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)


  // ------------------------------------------------
  // Load events from Supabase
  // ------------------------------------------------

  const fetchCalendarEvents = async () => {

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })

    if (error) {

      console.error('Calendar fetch error:', error)

      setError(error.message)
      setLoading(false)

      return
    }

    setRawEvents(data || [])
    setLoading(false)
  }


  // ------------------------------------------------
  // Initial load + Supabase Realtime
  // ------------------------------------------------

  useEffect(() => {

    fetchCalendarEvents()

    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
        },
        () => {
          fetchCalendarEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [])


  // ------------------------------------------------
  // Find conflicts ONLY inside visible calendar range
  // AND only between DIFFERENT members
  // ------------------------------------------------
  const [conflictPairs, setConflictPairs] = useState([])
  const visibleConflictIds = useMemo(() => {

    const conflictIds = new Set()

    const pairs = []

    if (!visibleRange) {
      return conflictIds
    }


    // Only events that intersect the visible calendar range
    const visibleEvents = rawEvents.filter((event) => {

      const start = new Date(event.start_time)
      const end = new Date(event.end_time)

      return (
        start < visibleRange.end &&
        end > visibleRange.start
      )
    })


    // Compare every event with every other event
    for (let i = 0; i < visibleEvents.length; i++) {

      for (let j = i + 1; j < visibleEvents.length; j++) {

        const eventA = visibleEvents[i]
        const eventB = visibleEvents[j]


        // Same member = NOT a team conflict
        if (eventA.member_name === eventB.member_name) {
          continue
        }


        const startA = new Date(eventA.start_time)
        const endA = new Date(eventA.end_time)

        const startB = new Date(eventB.start_time)
        const endB = new Date(eventB.end_time)


        const overlaps =
          startA < endB &&
          startB < endA


        if (overlaps) {

            conflictIds.add(
                `${eventA.member_name}-${eventA.google_event_id}`
            )

            conflictIds.add(
                `${eventB.member_name}-${eventB.google_event_id}`
            )

            pairs.push({
                memberA: eventA.member_name,
                memberB: eventB.member_name,
                start: new Date(
                Math.max(startA.getTime(), startB.getTime())
                ),
                end: new Date(
                Math.min(endA.getTime(), endB.getTime())
                ),
            })
        }
      }
    }

    setConflictPairs(pairs)

    return conflictIds

  }, [rawEvents, visibleRange])


  // ------------------------------------------------
  // Conflict count
  // ------------------------------------------------

  const conflictCount = visibleConflictIds.size


  // ------------------------------------------------
  // Convert Supabase rows → FullCalendar events
  // ------------------------------------------------

  const calendarEvents = useMemo(() => {

    return rawEvents.map((event) => {

      const eventId =
        `${event.member_name}-${event.google_event_id}`

      const hasConflict =
        visibleConflictIds.has(eventId)

      const memberColor =
        getMemberColor(event.member_name)


      return {

        id: eventId,

        title: hasConflict
          ? `⚠ ${event.member_name} • ${event.title || 'Meeting'}`
          : `${event.member_name} • ${event.title || 'Meeting'}`,

        start: event.start_time,
        end: event.end_time,

        backgroundColor: memberColor,

        borderColor: hasConflict
          ? '#ef4444'
          : memberColor,

        borderWidth: hasConflict ? 4 : 1,

        extendedProps: {
            memberName: event.member_name,
            calendarEmail: event.calendar_email,
            googleEventId: event.google_event_id,
            originalTitle: event.title || 'Meeting',
            hasConflict,
        },
      }

    })

  }, [rawEvents, visibleConflictIds])


  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (

    <div className="p-6">


      {/* Page Header */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold">
          Team Calendar
        </h1>

        <p className="mt-1 opacity-60">
          Shared team meeting calendar
        </p>

      </div>


      {/* Loading */}

      {loading && (

        <div className="p-6">
          Loading calendar...
        </div>

      )}


      {/* Error */}

      {error && (

        <div className="alert alert-error mb-4">
          {error}
        </div>

      )}


      {/* Calendar */}

      {!loading && !error && (

        <div className="bg-base-100 rounded-lg p-5 shadow">


          {/* Conflict Warning */}

          {/* Conflict Warning */}

            {conflictPairs.length > 0 && (
                <div className="alert alert-warning mb-5">
                    <div className="w-full">

                    <div className="font-bold">
                        ⚠ {conflictPairs.length}{' '}
                        {conflictPairs.length === 1
                        ? 'Scheduling Conflict'
                        : 'Scheduling Conflicts'}
                    </div>

                    <div className="mt-2 space-y-1">
                        {conflictPairs.map((conflict, index) => (
                        <div
                            key={index}
                            className="text-sm"
                        >
                            <strong>
                            {conflict.memberA} ↔ {conflict.memberB}
                            </strong>

                            {' — '}

                            {conflict.start.toLocaleString([], {
                                weekday: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            })}

                            {' – '}

                            {conflict.end.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            })}
                        </div>
                        ))}
                    </div>

                    </div>
                </div>
            )}


          {/* Member Legend */}

          <div className="flex flex-wrap items-center gap-5 mb-5">

            {Object.entries(MEMBER_COLORS).map(
              ([name, color]) => (

                <div
                  key={name}
                  className="flex items-center gap-2 text-sm font-medium"
                >

                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: color
                    }}
                  />

                  <span>
                    {name}
                  </span>

                </div>

              )
            )}


            <div className="flex items-center gap-2 text-sm font-medium">

              <span className="text-red-500">
                ⚠
              </span>

              <span>
                Time Conflict
              </span>

            </div>

          </div>


          {/* FullCalendar */}

          <FullCalendar

            plugins={[
              timeGridPlugin,
              dayGridPlugin,
              interactionPlugin
            ]}

            initialView="timeGridWeek"

            datesSet={(dateInfo) => {

              setVisibleRange({
                start: dateInfo.start,
                end: dateInfo.end,
              })

            }}

            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay,dayGridMonth'
            }}

            events={calendarEvents}

            eventClick={(info) => {
                setSelectedEvent({
                    title: info.event.extendedProps.originalTitle,
                    memberName: info.event.extendedProps.memberName,
                    calendarEmail: info.event.extendedProps.calendarEmail,
                    start: info.event.start,
                    end: info.event.end,
                    hasConflict: info.event.extendedProps.hasConflict,
                })
            }}

            height="auto"

            allDaySlot={true}

            nowIndicator={true}

            slotMinTime="00:00:00"

            slotMaxTime="24:00:00"

            slotDuration="00:30:00"

            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}

            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day'
            }}

          />

        </div>

      )}
        {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">

                <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-md p-6">

                <div className="flex justify-between items-start mb-5">

                    <div>
                    <h2 className="text-xl font-bold">
                        Meeting Details
                    </h2>

                    {selectedEvent.hasConflict && (
                        <div className="text-error text-sm mt-1 font-semibold">
                        ⚠ Time Conflict
                        </div>
                    )}
                    </div>

                    <button
                    className="btn btn-sm btn-circle btn-ghost"
                    onClick={() => setSelectedEvent(null)}
                    >
                    ✕
                    </button>

                </div>


                <div className="space-y-4">

                    <div>
                    <div className="text-xs opacity-60">
                        Member
                    </div>

                    <div className="font-semibold">
                        {selectedEvent.memberName}
                    </div>
                    </div>


                    <div>
                    <div className="text-xs opacity-60">
                        Meeting
                    </div>

                    <div className="font-semibold">
                        {selectedEvent.title}
                    </div>
                    </div>


                    <div>
                    <div className="text-xs opacity-60">
                        Start
                    </div>

                    <div>
                        {selectedEvent.start?.toLocaleString([], {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        })}
                    </div>
                    </div>


                    <div>
                    <div className="text-xs opacity-60">
                        End
                    </div>

                    <div>
                        {selectedEvent.end?.toLocaleString([], {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        })}
                    </div>
                    </div>


                    {selectedEvent.calendarEmail && (
                    <div>
                        <div className="text-xs opacity-60">
                        Calendar
                        </div>

                        <div className="break-all">
                        {selectedEvent.calendarEmail}
                        </div>
                    </div>
                    )}

                </div>


                <div className="mt-6 flex justify-end">

                    <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedEvent(null)}
                    >
                    Close
                    </button>

                </div>

                </div>

            </div>
        )}

    </div>
  )
}


export default Calendar