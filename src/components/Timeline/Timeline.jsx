import React, { useEffect, useRef, useState, useCallback } from 'react';
import { formatHours, convertInterval, convertInMinutes } from '../../utils/date';
import './style.scss';
import { DAY_HOURS } from '../../constansts';
import { Event } from './Event';
import { firebaseService } from '../../services';
import { Task } from './Task';
import { Reminder } from './Reminder';
import { EditDialog } from '../Modal/EditDialog';

export const Timeline = ({ date }) => {
    const fieldRef = useRef();
    const timestampRef = useRef();

    const [barHeight, setBarHeight] = useState();
    const [positions, setPositions] = useState([80]);
    const [nextPosition, setNextPosition] = useState();

    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [reminders, setReminders] = useState([]);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState();
    
    const toggleEdit = useCallback(() => setIsEditOpen((isEditOpen) => !isEditOpen), []);

    const toggleWithSetNote = (id, type) => () => {
        let note;
        switch (type) {
            case 'task':
                note = tasks.find(task => task.id === id);
                break;
            case 'event':
                note = events.find(event => event.id === id);
                break;
            case 'reminder':
                note = reminders.find(reminder => reminder.id === id);
                break;
            default:
                break;
        }
        setCurrentNote({ ...note, type });
    }

    const onEventRemove = (id) => (e) => {  
        e.stopPropagation();
        firebaseService.removeEvent(id);
    };

    const onReminderRemove = (id) => (e) => {
        e.stopPropagation();
        firebaseService.removeReminder(id);
    }

    useEffect(() => {
        if (currentNote) {
            toggleEdit();
        }
    }, [currentNote, toggleEdit]);

    useEffect(() => {
        if (nextPosition) {
            setPositions((positions) => [...positions, nextPosition]);
        }
    }, [nextPosition]);

    useEffect(() => {
        setBarHeight(timestampRef.current.getBoundingClientRect().height);

        const unsubscribeTasks = firebaseService.listenTasks((tasks) => {
            setTasks(tasks);
        }, [date]);

        const unsubscribeEvents = firebaseService.listenEvents((events) => {
            setEvents(events);
        }, [date]);

        const unsubscribeReminders = firebaseService.listenReminders((reminders) => {
            setReminders(reminders);
        }, [date]);

        return () => {
            unsubscribeTasks();
            unsubscribeEvents();
            unsubscribeReminders();
        }
    }, [date]);

    let timestamps = [
        <div className="timestamp" ref={timestampRef} key={0}>
            <hr /><div className="time">{formatHours(0)}</div>
        </div>
    ];

    for (let i = 1; i < DAY_HOURS + 1; i++) {
        timestamps.push(
            <div className="timestamp" key={i}>
                <hr /><div className="time">{formatHours(i)}</div>
            </div>
        );
    }

    return <>
        {currentNote && <EditDialog isOpen={isEditOpen} task={currentNote} onClose={toggleEdit} />}
        <div className="taskstable">
            {tasks.map((task, i) => <Task
                key={task.id}
                onClick={toggleWithSetNote}
                task={task}
            />)}
        </div>
        <div className="timeline">
            <div className="notefield" ref={fieldRef}>
                {events.map((event) => ({ ...convertInterval(event.interval), ...event }))
                    .sort((a, b) => ((b.endTime - b.startTime) - (a.endTime - a.startTime)))
                    .map(((event, i) =>
                        <Event
                            event={event}
                            barHeight={barHeight}
                            position={positions[i]}
                            setNextPosition={setNextPosition}
                            onClick={toggleWithSetNote}
                            onRemove={onEventRemove}
                            key={event.id}
                        />
                    ))
                }
                {reminders.map(reminder =>
                    ({ ...reminder, time: convertInMinutes(reminder.time) })).map((reminder, i) =>
                        <Reminder key={reminder.id}
                            reminder={reminder}
                            setNextPosition={setNextPosition}
                            position={positions[events.length + i]}
                            barHeight={barHeight}
                            onClick={toggleWithSetNote}
                            onRemove={onReminderRemove}
                        />
                    )}
            </div>
            {timestamps}
        </div>
    </>;
};