
import { fakeAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyDashComponent } from './my-dash.component';

describe('MyDashComponent', () => {
  let component: MyDashComponent;
  let fixture: ComponentFixture<MyDashComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MyDashComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyDashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
