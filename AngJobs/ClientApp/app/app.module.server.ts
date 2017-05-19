import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { sharedConfig } from './app.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
    bootstrap: sharedConfig.bootstrap,
    declarations: sharedConfig.declarations,
    imports: [
        ServerModule,
        NoopAnimationsModule,
        ...sharedConfig.imports
    ]
})
export class AppModule {
}
