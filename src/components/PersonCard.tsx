import { useState } from "react";
import type { Person } from "../graph/types";

interface Props {
  person: Person;
  onClose: () => void;
  onSave: (updated: Partial<Person>) => void;
}

export default function PersonCard({ person, onClose, onSave }: Props) {
  const [name, setName] = useState(person.name);
  const [gender, setGender] = useState(person.gender ?? "unknown");
  const [birthYear, setBirthYear] = useState(person.birth_year?.toString() ?? "");
  const [deathYear, setDeathYear] = useState(person.death_year?.toString() ?? "");
  const [notes, setNotes] = useState(person.notes ?? "");

  function handleSave() {
    onSave({
      name,
      gender,
      birth_year: birthYear ? parseInt(birthYear, 10) : undefined,
      death_year: deathYear ? parseInt(deathYear, 10) : undefined,
      notes: notes || undefined,
    });
    onClose();
  }

  return (
    <div className="absolute right-4 top-4 z-10 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Edit Person</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
      </div>
      <label className="mb-2 block text-sm">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1 text-sm" />
      </label>
      <label className="mb-2 block text-sm">
        Gender
        <select value={gender} onChange={(e) => setGender(e.target.value as Person["gender"])} className="mt-1 block w-full rounded border px-2 py-1 text-sm">
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>
      <label className="mb-2 block text-sm">
        Birth Year
        <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1 text-sm" />
      </label>
      <label className="mb-2 block text-sm">
        Death Year
        <input type="number" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1 text-sm" />
      </label>
      <label className="mb-2 block text-sm">
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1 text-sm" rows={2} />
      </label>
      <button onClick={handleSave} className="mt-2 w-full rounded bg-blue-600 py-1 text-sm text-white hover:bg-blue-700">
        Save
      </button>
    </div>
  );
}
