import { addDogAction, addSampleDogAction, deleteDogAction } from "@/app/actions";
import type { Dog } from "@/lib/db";
import { SAMPLE_DOG } from "@/lib/services";

export function DogPanel({ dogs }: { dogs: Dog[] }) {
  return (
    <section className="card card-pad">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="badge">Your dogs</p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            The roster
          </h2>
        </div>
        <form action={addSampleDogAction}>
          <button className="btn btn-ghost btn-small" type="submit">
            Add {SAMPLE_DOG.name} · {SAMPLE_DOG.breed}
          </button>
        </form>
      </div>

      {dogs.length === 0 ? (
        <div className="empty" style={{ marginTop: 16 }}>
          No dogs yet. Register one below, or add Barnaby in one click for the
          live demo.
        </div>
      ) : (
        <div className="stack" style={{ marginTop: 16 }}>
          {dogs.map((dog) => (
            <article key={dog.id} className="dog-card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <strong>{dog.name}</strong>
                  <div className="muted">{dog.breed}</div>
                </div>
                <form action={deleteDogAction}>
                  <input type="hidden" name="dogId" value={dog.id} />
                  <button className="btn btn-danger btn-small" type="submit">
                    Remove
                  </button>
                </form>
              </div>
              {dog.notes ? <p className="faint">{dog.notes}</p> : null}
            </article>
          ))}
        </div>
      )}

      <form action={addDogAction} className="stack" style={{ marginTop: 18 }}>
        <div className="grid-2">
          <label className="field">
            <span>Name</span>
            <input name="name" required placeholder="Maple" />
          </label>
          <label className="field">
            <span>Breed</span>
            <input name="breed" required placeholder="Cockapoo" />
          </label>
        </div>
        <label className="field">
          <span>Coat / notes</span>
          <textarea
            name="notes"
            placeholder="Sensitive tummy, prefers oatmeal shampoo"
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Register dog
        </button>
      </form>
    </section>
  );
}
