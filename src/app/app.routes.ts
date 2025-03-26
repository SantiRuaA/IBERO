import { Routes, RouterModule } from '@angular/router';
import { LandingComponent } from './views/landing-page/landing-page.component';
import { unsavedChangesGuard } from './auth/guards/unsaved-changes.guard';
import { LoginComponent } from './auth/login/login.component';
import { InfoComponent } from './views/info/info.component';
import { ListInstructoresComponent } from './views/instructor/list-instructores/list-instructores.component';
import { isLoggedInGuard } from './auth/guards/is-logged-in.guard';
import { NewInstructorComponent } from './views/instructor/new-instructor/new-instructor.component';
import { ListResultadosComponent } from './views/resultados-aprendizaje/list-resultados/list-resultados.component';
import { NewResultadoComponent } from './views/resultados-aprendizaje/new-resultado/new-resultado.component';
import { EditInstructorComponent } from './views/instructor/edit-instructor/edit-instructor.component';
import { ViewInstructorComponent } from './views/instructor/view-instructor/view-instructor.component';
import { ViewResultadosComponent } from './views/resultados-aprendizaje/view-resultados/view-resultados.component';
import { EditResultadoComponent } from './views/resultados-aprendizaje/edit-resultado/edit-resultado.component';
import { ListProgramaComponent } from './views/programa/list-programa/list-programa.component';
import { EditProgramaComponent } from './views/programa/edit-programa/edit-programa.component';
import { NewProgramaComponent } from './views/programa/new-programa/new-programa.component';
import { ViewProgramaComponent } from './views/programa/view-programa/view-programa.component';
import { NewPwdComponent } from './auth/new-pwd/new-pwd.component';
import { ListCompetenciaComponent } from './views/competencia/list-competencia/list-competencia.component';
import { NewCompetenciaComponent } from './views/competencia/new-competencia/new-competencia.component';
import { ViewCompetenciaComponent } from './views/competencia/view-competencia/view-competencia.component';
import { EditCompetenciaComponent } from './views/competencia/edit-competencia/edit-competencia.component';
import { ListProgramacionComponent } from './views/programacion/list-programacion/list-programacion.component';
import { NewProgramacionComponent } from './views/programacion/new-programacion/new-programacion.component';
import { EditProgramacionComponent } from './views/programacion/edit-programacion/edit-programacion.component';
import { ViewProgramacionComponent } from './views/programacion/view-programacion/view-programacion.component';
import { NotFoundComponent } from './components/404/404.component';

const token = localStorage.getItem('token');

export const routes: Routes = [
    { path: '', redirectTo: 'landing-component', pathMatch: 'full' }, 

    { path: 'landing-component', component: LandingComponent },

    { path: 'auth/login', component: LoginComponent },

    { path: `cambiarPWD`, component: NewPwdComponent },

    { path : 'info', component: InfoComponent, canActivate: [isLoggedInGuard]},

    { path: 'instructor', component: ListInstructoresComponent, canActivate: [isLoggedInGuard] },

    { path: 'new-instructor', component: NewInstructorComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard]},

    { path: 'view-instructor/:id', component: ViewInstructorComponent, canActivate: [isLoggedInGuard] },

    { path: 'edit-instructor/:id', component: EditInstructorComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard]},

    { path: 'resultados-aprendizaje', component: ListResultadosComponent, canActivate: [isLoggedInGuard] },

    { path: 'new-resultados', component: NewResultadoComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard]},

    { path: 'view-resultado/:id', component: ViewResultadosComponent, canActivate: [isLoggedInGuard] },

    { path: 'edit-resultado/:id', component: EditResultadoComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard]},

    { path: 'programa', component: ListProgramaComponent, canActivate: [isLoggedInGuard] },

    { path: 'new-programa', component: NewProgramaComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard] },

    { path: 'view-programa/:id', component: ViewProgramaComponent, canActivate: [isLoggedInGuard] },

    { path: 'edit-programa/:id', component: EditProgramaComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard]},

    { path: 'competencia', component: ListCompetenciaComponent, canActivate: [isLoggedInGuard] },

    { path: 'new-competencia', component: NewCompetenciaComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard]},

    { path: 'view-competencia/:id', component: ViewCompetenciaComponent, canActivate: [isLoggedInGuard] },

    { path: 'edit-competencia/:id', component: EditCompetenciaComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard]},

    { path: 'programacion', component: ListProgramacionComponent, canActivate: [isLoggedInGuard] },
    
    { path: 'new-programacion', component: NewProgramacionComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard]},

    { path: 'view-programacion/:id', component: ViewProgramacionComponent, canActivate: [isLoggedInGuard] },

    { path: 'edit-programacion/:id', component: EditProgramacionComponent, canActivate: [isLoggedInGuard], canDeactivate: [unsavedChangesGuard]},
    
    { path: '**', component: NotFoundComponent}, 

    
];
