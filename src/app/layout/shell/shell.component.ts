import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [SidebarComponent],
    templateUrl: './shell.component.html',
})
export class ShellComponent { }