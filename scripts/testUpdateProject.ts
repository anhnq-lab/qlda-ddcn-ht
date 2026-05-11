import { ProjectService } from '../services/ProjectService';

async function run() {
    try {
        const id = '8053443';
        // Just try an empty update to see what fails
        const project = await ProjectService.getById(id);
        console.log("Found project:", project?.ProjectID);
        if (project) {
            await ProjectService.update(id, { ProjectName: project.ProjectName + ' test' });
            console.log("Update success");
        }
    } catch (err) {
        console.error("Update failed:", err);
    }
}
run();
