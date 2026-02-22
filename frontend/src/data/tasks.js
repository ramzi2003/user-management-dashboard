import { Droplets, Globe, BookOpen, TreePine, FileText } from 'lucide-react';

export function createInitialTasks() {
  return [
    { id: 1, title: 'Drink water', description: 'Planned', Icon: Droplets, iconColor: '#5b9bd5', unitValue: '0/5', unitLabel: 'glasses', done: false, skipped: false },
    { id: 2, title: 'Learn a new language', description: 'Planned', Icon: Globe, iconColor: '#5b9bd5', unitValue: '25m', unitLabel: '', done: false, skipped: false },
    { id: 3, title: 'Read', description: 'Planned', Icon: BookOpen, iconColor: '#d45b5b', unitValue: '0/10', unitLabel: 'pages', done: false, skipped: false },
    { id: 4, title: 'Go for a walk', description: 'Planned', Icon: TreePine, iconColor: '#5bd45b', unitValue: '0/2', unitLabel: 'miles', done: false, skipped: false },
    { id: 5, title: 'Finish project report', description: 'Done', Icon: FileText, iconColor: '#9b5bd4', unitValue: '1/1', unitLabel: 'task', done: true, skipped: false },
  ];
}
