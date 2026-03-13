import { H1, Spinner, Callout } from "@blueprintjs/core";
import { useQuery } from "@tanstack/react-query";
import api from "./api/axiosInstance";
import { TaskItem } from "./components/TaskItem";
import { TaskForm } from "./components/TaskForm"; // New import

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
}

function App() {
  const { data: tasks, isLoading, error } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await api.get("/tasks");
      return response.data;
    },
  });

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <header style={{ marginBottom: "20px", textAlign: "center" }}>
        <H1>Task Manager</H1>
      </header>

      <main>
        {/* Isolated Form Component */}
        <TaskForm />

        {isLoading && <Spinner style={{ marginTop: "20px" }} />}

        {error && (
          <Callout intent="danger" title="Connection Error" style={{ marginBottom: "20px" }}>
            Could not fetch tasks. Is the backend running?
          </Callout>
        )}

        {/* Task List */}
        <section>
          {tasks?.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </section>

        {tasks?.length === 0 && !isLoading && (
          <p style={{ textAlign: "center", color: "#5c7080" }}>No tasks yet. Create your first one above!</p>
        )}
      </main>
    </div>
  );
}

export default App;

